import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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

type DeliveryType = "DELIVERY" | "PICKUP";

interface CheckoutFormData {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  recipientName: string;
  recipientEmail: string;

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
  // Local mount flag — fires every component mount, independent of zustand
  // persist's `hasHydrated`, which can stay false when localStorage has no
  // cart-storage entry (fresh visit / after clearCart).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    defaultValues: { deliveryType: "DELIVERY" },
  });

  const deliveryType = watch("deliveryType");
  const pickupDate = watch("pickupDate");
  const pickupLocation = watch("pickupLocation");
  const deliveryWindow = watch("deliveryWindow");

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
  const surcharge =
    deliveryType === "DELIVERY" && deliveryWindow
      ? DELIVERY_WINDOWS[deliveryWindow].surcharge
      : 0;
  const total = subtotal + surcharge;

  const availablePickupSlots = useMemo(() => {
    if (!pickupDate) return Object.keys(PICKUP_TIME_SLOTS) as PickupTimeSlotKey[];
    return (Object.keys(PICKUP_TIME_SLOTS) as PickupTimeSlotKey[]).filter((k) =>
      isPickupSlotAvailable(pickupDate, k, new Date()),
    );
  }, [pickupDate]);

  // Reset slot when no longer valid for new date
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
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, customer: data, orderId }),
      });
      const result = await res.json();
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

  if (!mounted) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="lg:col-span-2 space-y-8 border border-gray-200 shadow-sm p-8 rounded-2xl bg-white"
      >
        {/* Buyer */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Buyer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register("buyerName", { required: true })} placeholder="Name" className="input-style" />
            <input {...register("buyerEmail", { required: true })} placeholder="Email" type="email" className="input-style" />
            <input {...register("buyerPhone", { required: true })} placeholder="Phone" className="input-style md:col-span-2" />
          </div>
        </section>

        {/* Recipient */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recipient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register("recipientName", { required: true })} placeholder="Recipient name" className="input-style" />
            <input {...register("recipientEmail", { required: true })} placeholder="Recipient email" type="email" className="input-style" />
          </div>
        </section>

        {/* Fulfilment toggle */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Fulfilment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className={`cursor-pointer border rounded-lg p-4 text-center transition ${deliveryType === "DELIVERY" ? "border-primary bg-primary/5 font-semibold" : "border-gray-300"}`}>
              <input type="radio" value="DELIVERY" {...register("deliveryType", { required: true })} className="sr-only" />
              <i className="ri-truck-line text-2xl block mb-1 text-primary"></i>
              Local Delivery
            </label>
            <label className={`cursor-pointer border rounded-lg p-4 text-center transition ${deliveryType === "PICKUP" ? "border-primary bg-primary/5 font-semibold" : "border-gray-300"}`}>
              <input type="radio" value="PICKUP" {...register("deliveryType", { required: true })} className="sr-only" />
              <i className="ri-store-2-line text-2xl block mb-1 text-primary"></i>
              Store Pickup
            </label>
          </div>
        </section>

        {/* Delivery details */}
        {deliveryType === "DELIVERY" && (
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Delivery Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input {...register("address")} placeholder="Address" className="input-style md:col-span-2" />
              <input {...register("postcode")} placeholder="Postcode" className="input-style" />
              <input {...register("deliveryDate")} type="date" min={todayISO()} className="input-style" />
            </div>
            <div>
              <label className="block font-medium text-gray-800 mb-2">Delivery Window</label>
              <div className="space-y-2">
                {(Object.keys(DELIVERY_WINDOWS) as DeliveryWindowKey[]).map((k) => (
                  <label key={k} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer ${deliveryWindow === k ? "border-primary bg-primary/5" : "border-gray-300"}`}>
                    <input type="radio" value={k} {...register("deliveryWindow")} />
                    <span className="text-gray-800">{DELIVERY_WINDOWS[k].label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pickup details */}
        {deliveryType === "PICKUP" && (
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Pickup Details</h3>
            <div>
              <label className="block font-medium text-gray-800 mb-2">Pickup Location</label>
              <div className="space-y-2">
                {(Object.keys(PICKUP_LOCATIONS) as PickupLocationKey[]).map((k) => (
                  <label key={k} className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${pickupLocation === k ? "border-primary bg-primary/5" : "border-gray-300"}`}>
                    <input type="radio" value={k} {...register("pickupLocation")} className="mt-1" />
                    <div>
                      <div className="font-semibold text-gray-800">{PICKUP_LOCATIONS[k].label}</div>
                      <div className="text-sm text-gray-700">{PICKUP_LOCATIONS[k].address}</div>
                      {PICKUP_LOCATIONS[k].note && (
                        <div className="text-xs text-gray-500 italic">{PICKUP_LOCATIONS[k].note}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-800 mb-2">Pickup Date</label>
                <input {...register("pickupDate")} type="date" min={todayISO()} className="input-style" />
              </div>
              <div>
                <label className="block font-medium text-gray-800 mb-2">Time Slot</label>
                <select {...register("pickupTimeSlot")} className="input-style">
                  <option value="">-- Select a time slot --</option>
                  {availablePickupSlots.map((k) => (
                    <option key={k} value={k}>{PICKUP_TIME_SLOTS[k].label}</option>
                  ))}
                </select>
                {pickupDate && availablePickupSlots.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    No slots available for this date. Pick another day.
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
              Note: Orders placed after 6:00 PM are available from 11:00 AM the next day.
            </p>
          </section>
        )}

        <section>
          <textarea
            {...register("message")}
            placeholder="Card message (optional)"
            className="input-style min-h-[100px]"
          />
        </section>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? "Submitting..." : `Confirm and Pay  ($${total.toFixed(2)})`}
        </button>
      </form>

      {/* Cart summary */}
      <div className="lg:col-span-1 border border-gray-200 shadow-sm p-6 rounded-2xl bg-white sticky top-10 h-fit">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-4 items-center">
                  <img
                    src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-sm text-gray-500">x {item.quantity}</div>
                  </div>
                  <div className="font-semibold text-gray-700">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {surcharge > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Priority delivery</span>
                  <span>+ ${surcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 pt-1">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
