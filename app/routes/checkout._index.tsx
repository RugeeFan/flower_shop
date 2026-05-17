import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useCartStore } from "~/zustand/useCartStore";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
  isPickupSlotAvailable,
  type DeliveryWindowKey,
  type PickupLocationKey,
  type PickupTimeSlotKey,
} from "~/lib/delivery";
import formatCurrency from "~/utils/formatCurrency";
import EnDatePicker from "~/components/store/EnDatePicker";

type DeliveryType = "DELIVERY" | "PICKUP";

interface CheckoutFormData {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;

  deliveryType: DeliveryType;

  // delivery-only
  address?: string;
  postcode?: string;
  deliveryDate?: string;
  deliveryWindow?: DeliveryWindowKey;

  // pickup-only
  pickupLocation?: PickupLocationKey;
  pickupDate?: string;
  pickupTimeSlot?: PickupTimeSlotKey;

  message?: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function CheckoutPage() {
  const cart = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    defaultValues: { deliveryType: "DELIVERY", pickupDate: todayISO() },
  });

  const deliveryType = watch("deliveryType");
  const pickupDate = watch("pickupDate");
  const pickupLocation = watch("pickupLocation");
  const deliveryWindow = watch("deliveryWindow");
  const postcode = watch("postcode");

  // Postcode-based shipping fee fetched from the server. The same calculation
  // is used to charge through Stripe (api.create-checkout-session), so what
  // the customer sees here is what they get charged.
  const [zoneQuote, setZoneQuote] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "ok"; suburb: string | null; zoneFee: number }
    | { state: "error"; message: string }
  >({ state: "idle" });

  useEffect(() => {
    const saved = localStorage.getItem("checkout_form");
    if (saved) {
      try {
        reset(JSON.parse(saved));
      } catch (err) {
        console.warn("恢复表单失败", err);
      }
    }
  }, [reset]);

  useEffect(() => {
    const sub = watch((value) => {
      localStorage.setItem("checkout_form", JSON.stringify(value));
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart],
  );
  const windowSurcharge =
    deliveryType === "DELIVERY" && deliveryWindow
      ? DELIVERY_WINDOWS[deliveryWindow].surcharge
      : 0;
  const zoneFee = zoneQuote.state === "ok" ? zoneQuote.zoneFee : 0;
  const total = subtotal + windowSurcharge + zoneFee;

  // Refresh the postcode quote when the postcode or window changes. We debounce
  // through React's batching plus a 300ms timer so we don't hammer the API on
  // every keystroke.
  useEffect(() => {
    if (deliveryType !== "DELIVERY") {
      setZoneQuote({ state: "idle" });
      return;
    }
    const code = (postcode ?? "").trim();
    const win = deliveryWindow ?? "RESIDENTIAL";
    if (!/^\d{4}$/.test(code)) {
      setZoneQuote({ state: "idle" });
      return;
    }
    setZoneQuote({ state: "loading" });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/get-shipping-fee?postcode=${encodeURIComponent(code)}&deliveryWindow=${win}`,
          { signal: ctrl.signal },
        );
        const data = await res.json();
        if (!res.ok) {
          setZoneQuote({
            state: "error",
            message: data?.error || "Unable to quote shipping",
          });
          return;
        }
        setZoneQuote({
          state: "ok",
          suburb: data.suburb ?? null,
          zoneFee: Number(data.zoneFee ?? 0),
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setZoneQuote({ state: "error", message: "Network error" });
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [deliveryType, postcode, deliveryWindow]);

  const availablePickupSlots = useMemo(() => {
    if (!pickupDate) return Object.keys(PICKUP_TIME_SLOTS) as PickupTimeSlotKey[];
    return (Object.keys(PICKUP_TIME_SLOTS) as PickupTimeSlotKey[]).filter((k) =>
      isPickupSlotAvailable(pickupDate, k, new Date()),
    );
  }, [pickupDate]);

  useEffect(() => {
    const current = watch("pickupTimeSlot");
    if (current && pickupDate && !availablePickupSlots.includes(current)) {
      setValue("pickupTimeSlot", undefined as unknown as PickupTimeSlotKey);
    }
  }, [availablePickupSlots, pickupDate, setValue, watch]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (data.deliveryType === "DELIVERY") {
      if (!data.address || !data.postcode || !data.deliveryDate || !data.deliveryWindow) {
        alert("Please complete all delivery fields.");
        return;
      }
      if (zoneQuote.state === "error") {
        alert(zoneQuote.message);
        return;
      }
      if (zoneQuote.state !== "ok") {
        alert("Please wait while we calculate your delivery fee.");
        return;
      }
    } else {
      if (!data.pickupLocation || !data.pickupDate || !data.pickupTimeSlot) {
        alert("Please choose a pickup location, date and time slot.");
        return;
      }
      if (!isPickupSlotAvailable(data.pickupDate, data.pickupTimeSlot, new Date())) {
        alert(
          "That pickup slot is no longer available. Orders placed after 6 PM are available from 11 AM next day.",
        );
        return;
      }
    }

    const orderId = localStorage.getItem("current_order_id");
    const postCheckout = async (confirmDuplicate: boolean) => {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, customer: data, orderId, confirmDuplicate }),
      });
      return res.json();
    };
    try {
      let result = await postCheckout(false);
      if (result.duplicate) {
        const ok = window.confirm(
          result.message ||
            "You just paid for an identical order. Do you want to pay again?",
        );
        if (!ok) return;
        result = await postCheckout(true);
      }
      if (result.url) {
        if (result.orderId) localStorage.setItem("current_order_id", result.orderId);
        window.location.href = result.url;
      } else {
        alert(result.error || "Failed to create payment session.");
      }
    } catch (err) {
      console.error("create checkout session error:", err);
      alert("Network error. Please try again.");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  // ── Editorial primitives, scoped to this page ─────────────────────────────
  const SectionHeader = ({ index, kicker, title }: { index: string; kicker: string; title: string }) => (
    <div className="mb-6 flex items-baseline gap-4">
      <span className="font-display text-terracotta text-[20px] tabular-nums">{index}</span>
      <div>
        <div className="eyebrow">{kicker}</div>
        <h2 className="font-display text-charcoal text-[22px] md:text-[26px] leading-tight mt-0.5">
          {title}
        </h2>
      </div>
    </div>
  );

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block eyebrow mb-2">{children}</label>
  );

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <p className="text-[12px] text-terracotta mt-1">{message}</p>
    ) : null;

  // Shared regex literals — defined once so the rules and the submit-time
  // re-check stay consistent.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const POSTCODE_RE = /^\d{4}$/;
  const PHONE_RE = /^[+\d][\d\s()-]{5,}$/;

  const optionCard = (selected: boolean) =>
    `block cursor-pointer border transition-colors p-4 ${
      selected
        ? "border-charcoal bg-cream/50"
        : "border-border bg-white hover:border-charcoal/40"
    }`;

  return (
    <div className="bg-bone min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Page header */}
        <div className="mb-12">
          <div className="eyebrow mb-3">Checkout</div>
          <h1 className="font-display text-charcoal text-[36px] md:text-[48px] leading-display">
            Almost there.
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-12">
            {/* Buyer */}
            <section>
              <SectionHeader index="01" kicker="Your details" title="Who's sending these flowers?" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Full name</FieldLabel>
                  <input
                    {...register("buyerName", { required: "Please enter your name." })}
                    placeholder="Jane Smith"
                    className="input-style"
                  />
                  <FieldError message={errors.buyerName?.message} />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    {...register("buyerEmail", {
                      required: "Please enter your email.",
                      pattern: { value: EMAIL_RE, message: "That email looks off." },
                    })}
                    placeholder="jane@example.com"
                    type="email"
                    className="input-style"
                  />
                  <FieldError message={errors.buyerEmail?.message} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    {...register("buyerPhone", {
                      required: "Please enter a phone number.",
                      pattern: { value: PHONE_RE, message: "Use digits, spaces, +, ( ) or -." },
                    })}
                    placeholder="0451 182 178"
                    className="input-style"
                  />
                  <FieldError message={errors.buyerPhone?.message} />
                </div>
              </div>
            </section>

            <div className="hairline" />

            {/* Recipient */}
            <section>
              <SectionHeader index="02" kicker="Recipient" title="Who's receiving them?" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Recipient name</FieldLabel>
                  <input
                    {...register("recipientName", { required: "Please enter the recipient's name." })}
                    placeholder="Recipient's name"
                    className="input-style"
                  />
                  <FieldError message={errors.recipientName?.message} />
                </div>
                <div>
                  <FieldLabel>Recipient email</FieldLabel>
                  <input
                    {...register("recipientEmail", {
                      required: "Please enter the recipient's email.",
                      pattern: { value: EMAIL_RE, message: "That email looks off." },
                    })}
                    placeholder="recipient@example.com"
                    type="email"
                    className="input-style"
                  />
                  <FieldError message={errors.recipientEmail?.message} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Recipient phone</FieldLabel>
                  <input
                    {...register("recipientPhone", {
                      required: "Please enter the recipient's phone — the driver may need to call.",
                      pattern: { value: PHONE_RE, message: "Use digits, spaces, +, ( ) or -." },
                    })}
                    placeholder="0451 182 178"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="input-style"
                  />
                  <p className="text-[12px] text-ink-muted mt-1">
                    Used only if our driver needs to reach the recipient at delivery time.
                  </p>
                  <FieldError message={errors.recipientPhone?.message} />
                </div>
              </div>
            </section>

            <div className="hairline" />

            {/* Fulfilment toggle */}
            <section>
              <SectionHeader index="03" kicker="Fulfilment" title="Delivery or pickup?" />
              <div className="grid grid-cols-2 gap-4">
                <label className={optionCard(deliveryType === "DELIVERY")}>
                  <input
                    type="radio"
                    value="DELIVERY"
                    {...register("deliveryType", { required: true })}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <i className="ri-truck-line text-xl text-terracotta mt-0.5"></i>
                    <div>
                      <div className="font-display text-charcoal text-[18px] leading-tight">
                        Local Delivery
                      </div>
                      <div className="text-[13px] text-ink-muted mt-1">
                        Door-to-door across Sydney
                      </div>
                    </div>
                  </div>
                </label>
                <label className={optionCard(deliveryType === "PICKUP")}>
                  <input
                    type="radio"
                    value="PICKUP"
                    {...register("deliveryType", { required: true })}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <i className="ri-store-2-line text-xl text-terracotta mt-0.5"></i>
                    <div>
                      <div className="font-display text-charcoal text-[18px] leading-tight">
                        Store Pickup
                      </div>
                      <div className="text-[13px] text-ink-muted mt-1">
                        Parramatta or Gordon
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            {/* Delivery details */}
            {deliveryType === "DELIVERY" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FieldLabel>Address</FieldLabel>
                    <input
                      {...register("address", {
                        required: deliveryType === "DELIVERY" ? "Please enter the delivery address." : false,
                      })}
                      placeholder="Street address"
                      className="input-style"
                    />
                    <FieldError message={errors.address?.message} />
                  </div>
                  <div>
                    <FieldLabel>Postcode</FieldLabel>
                    <input
                      {...register("postcode", {
                        required: deliveryType === "DELIVERY" ? "Please enter a 4-digit postcode." : false,
                        pattern: { value: POSTCODE_RE, message: "Postcode must be 4 digits." },
                      })}
                      placeholder="2000"
                      className="input-style"
                    />
                    <FieldError message={errors.postcode?.message} />
                  </div>
                  <div>
                    <FieldLabel>Delivery date</FieldLabel>
                    <Controller
                      name="deliveryDate"
                      control={control}
                      rules={{
                        required: deliveryType === "DELIVERY" ? "Please pick a delivery date." : false,
                        validate: (v) =>
                          !v ||
                          deliveryType !== "DELIVERY" ||
                          v >= todayISO() ||
                          "Delivery date can't be in the past.",
                      }}
                      render={({ field }) => (
                        <EnDatePicker
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          minDate={todayISO()}
                          placeholder="Pick a delivery date"
                          ariaLabel="Delivery date"
                        />
                      )}
                    />
                    <FieldError message={errors.deliveryDate?.message} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Delivery window</FieldLabel>
                  <div className="space-y-2">
                    {(Object.keys(DELIVERY_WINDOWS) as DeliveryWindowKey[]).map((k) => (
                      <label key={k} className={optionCard(deliveryWindow === k)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              value={k}
                              {...register("deliveryWindow", {
                                required: deliveryType === "DELIVERY" ? "Please choose a delivery window." : false,
                              })}
                              className="accent-charcoal"
                            />
                            <span className="text-charcoal text-[14px]">
                              {DELIVERY_WINDOWS[k].label}
                            </span>
                          </div>
                          {DELIVERY_WINDOWS[k].surcharge > 0 && (
                            <span className="text-[12px] text-terracotta tabular-nums">
                              +{formatCurrency(DELIVERY_WINDOWS[k].surcharge)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.deliveryWindow?.message} />
                </div>
              </section>
            )}

            {/* Pickup details */}
            {deliveryType === "PICKUP" && (
              <section className="space-y-6">
                <div>
                  <FieldLabel>Pickup location</FieldLabel>
                  <div className="space-y-2">
                    {(Object.keys(PICKUP_LOCATIONS) as PickupLocationKey[]).map((k) => (
                      <label key={k} className={optionCard(pickupLocation === k)}>
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            value={k}
                            {...register("pickupLocation", {
                              required: deliveryType === "PICKUP" ? "Please choose a pickup location." : false,
                            })}
                            className="mt-1 accent-charcoal"
                          />
                          <div>
                            <div className="font-display text-charcoal text-[16px]">
                              {PICKUP_LOCATIONS[k].label}
                            </div>
                            <div className="text-[13px] text-ink-muted mt-1">
                              {PICKUP_LOCATIONS[k].address}
                            </div>
                            {PICKUP_LOCATIONS[k].note && (
                              <div className="text-[12px] text-ink-muted/80 italic mt-1">
                                {PICKUP_LOCATIONS[k].note}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.pickupLocation?.message} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Pickup date</FieldLabel>
                    <Controller
                      name="pickupDate"
                      control={control}
                      rules={{
                        required: deliveryType === "PICKUP" ? "Please pick a pickup date." : false,
                        validate: (v) =>
                          !v ||
                          deliveryType !== "PICKUP" ||
                          v >= todayISO() ||
                          "Pickup date can't be in the past.",
                      }}
                      render={({ field }) => (
                        <EnDatePicker
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          minDate={todayISO()}
                          placeholder="Pick a pickup date"
                          ariaLabel="Pickup date"
                        />
                      )}
                    />
                    <FieldError message={errors.pickupDate?.message} />
                  </div>
                  <div>
                    <FieldLabel>Time slot</FieldLabel>
                    <select
                      {...register("pickupTimeSlot", {
                        required: deliveryType === "PICKUP" ? "Please choose a time slot." : false,
                      })}
                      className="input-style"
                    >
                      <option value="">Select a time slot</option>
                      {availablePickupSlots.map((k) => (
                        <option key={k} value={k}>
                          {PICKUP_TIME_SLOTS[k].label}
                        </option>
                      ))}
                    </select>
                    {pickupDate && availablePickupSlots.length === 0 && (
                      <p className="text-[12px] text-terracotta mt-2">
                        No slots available for this date — please pick another day.
                      </p>
                    )}
                    <FieldError message={errors.pickupTimeSlot?.message} />
                  </div>
                </div>
                <p className="text-[12px] text-ink-muted bg-cream/60 border border-border p-4">
                  Orders placed after 6:00 PM are available from 11:00 AM the next day.
                </p>
              </section>
            )}

            <div className="hairline" />

            {/* Card message */}
            <section>
              <SectionHeader index="04" kicker="A note" title="Add a card message?" />
              <textarea
                {...register("message")}
                placeholder="Optional — a few words for the recipient"
                className="input-style min-h-[120px] resize-y"
              />
            </section>

            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-charcoal text-bone hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed py-4 px-6 text-[12px] font-medium uppercase tracking-eyebrow transition-colors"
            >
              {isSubmitting
                ? "Submitting…"
                : `Confirm and pay  ${formatCurrency(total)}`}
            </button>

            {Object.keys(errors).length > 0 && (
              <p className="text-[12px] text-terracotta text-center">
                Please complete all required fields above.
              </p>
            )}
          </form>

          {/* CART SUMMARY (sticky, editorial) */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-12 bg-cream/40 border border-border p-6 md:p-8">
              <div className="eyebrow mb-2">Your bag</div>
              <h2 className="font-display text-charcoal text-[22px] mb-6">Order summary</h2>

              {cart.length === 0 ? (
                <p className="text-ink-muted text-[14px]">
                  Your bag is empty.
                </p>
              ) : (
                <>
                  <ul className="space-y-5 mb-6">
                    {cart.map((item) => (
                      <li key={item.id} className="flex gap-4">
                        <div className="w-14 h-16 bg-white flex-shrink-0 overflow-hidden">
                          <img
                            src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-charcoal text-[14px] leading-tight truncate">
                            {item.name}
                          </div>
                          <div className="text-[12px] text-ink-muted mt-1">
                            Qty {item.quantity}
                          </div>
                        </div>
                        <div className="text-[13px] text-charcoal tabular-nums">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2 pt-5 border-t border-border text-[13px]">
                    <div className="flex justify-between text-ink-muted">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                    {deliveryType === "DELIVERY" && zoneQuote.state === "loading" && (
                      <div className="flex justify-between text-ink-muted">
                        <span>Delivery</span>
                        <span className="text-[12px] italic">calculating…</span>
                      </div>
                    )}
                    {deliveryType === "DELIVERY" && zoneQuote.state === "ok" && zoneFee > 0 && (
                      <div className="flex justify-between text-ink-muted">
                        <span>
                          Delivery
                          {zoneQuote.suburb && (
                            <span className="text-[11px] text-ink-muted/70"> · {zoneQuote.suburb}</span>
                          )}
                        </span>
                        <span className="tabular-nums">+ {formatCurrency(zoneFee)}</span>
                      </div>
                    )}
                    {deliveryType === "DELIVERY" && zoneQuote.state === "error" && (
                      <div className="text-[12px] text-terracotta">
                        {zoneQuote.message}
                      </div>
                    )}
                    {windowSurcharge > 0 && (
                      <div className="flex justify-between text-ink-muted">
                        <span>Priority delivery</span>
                        <span className="tabular-nums">+ {formatCurrency(windowSurcharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="font-display text-charcoal text-[16px]">Total</span>
                      <span className="font-display text-charcoal text-[16px] tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
