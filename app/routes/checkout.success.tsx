import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { stripe } from "~/lib/stripe.server";
import { prisma } from "~/lib/prisma.server";
import { useEffect } from "react";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
} from "~/lib/delivery";
import { markOrderPaid } from "~/lib/orders.server";
import { useCartStore } from "~/zustand/useCartStore";
import formatCurrency from "~/utils/formatCurrency";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const devOrderId = url.searchParams.get("devOrderId");
  const sessionId = url.searchParams.get("session_id");

  let orderId: string;
  let devMode = false;

  if (devOrderId) {
    devMode = true;
    orderId = devOrderId;
  } else if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      throw new Response("Payment not completed", { status: 402 });
    }
    if (!session.metadata?.orderId) {
      throw new Response("Order Not Found", { status: 404 });
    }
    orderId = session.metadata.orderId;

    // Stripe says paid; our DB may still be PENDING if the webhook is
    // delayed or unreachable. Act as a backstop and transition the order
    // here. markOrderPaid uses an atomic updateMany so whichever path wins
    // (this loader vs. the webhook) is the only one that fires the email.
    const result = await markOrderPaid(orderId, session.id);
    if (result.status === "not_found") {
      throw new Response("Order Not Found", { status: 404 });
    }
  } else {
    throw new Response("Missing session_id", { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Response("Order Not Found", { status: 404 });
  // Dev-mode flow already marks the order PAID in the create-checkout-session
  // route, and the Stripe branch above transitions it through markOrderPaid.
  // If we still see a non-PAID order here, something is genuinely wrong —
  // e.g. CANCELLED via session.expired — so surface it rather than masking.
  if (order.status !== "PAID") {
    throw new Response(`Order is ${order.status}`, { status: 409 });
  }

  return json({
    order,
    devMode,
    customerEmailSent: order.customerEmailSentAt !== null,
  });
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="eyebrow mb-1">{label}</div>
    <div className="text-charcoal text-[15px] leading-snug">{children}</div>
  </div>
);

export default function CheckoutSuccessPage() {
  const { order, devMode, customerEmailSent } = useLoaderData<typeof loader>();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
    localStorage.removeItem("current_order_id");
    localStorage.removeItem("checkout_form");
  }, [clearCart]);

  const isPickup = order.deliveryType === "PICKUP";
  const subtotal = order.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );

  return (
    <div className="bg-bone min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {devMode && (
          <div className="mb-8 border border-border bg-cream/60 p-4 text-[12px] text-ink-muted">
            <span className="eyebrow text-terracotta mr-2">Dev mode</span>
            Stripe was bypassed. No real charge — order saved, notification email
            sent (or logged to console if SMTP is not configured).
          </div>
        )}

        {/* Headline */}
        <div className="mb-12">
          <div className="eyebrow mb-3">
            {devMode ? "Order created" : "Payment received"}
          </div>
          <h1 className="font-display text-charcoal text-[44px] md:text-[60px] leading-display tracking-tight">
            Thank you.
          </h1>
          <p className="mt-4 text-ink-muted text-[15px] max-w-[42ch] leading-body">
            {customerEmailSent ? (
              <>We've got it from here. A confirmation has been emailed to you.</>
            ) : (
              <>
                We've got it from here. Your order has been received and our
                team will follow up if anything's needed.
              </>
            )}
          </p>
        </div>

        {/* Order summary card */}
        <div className="border border-border bg-white p-6 md:p-8">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="eyebrow">Order</div>
              <div className="font-display text-charcoal text-[18px] mt-1 break-all">
                {order.id}
              </div>
            </div>
          </div>

          <div className="hairline mb-6" />

          {/* Recipient + fulfilment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Recipient">
              {order.recipientName}
              <div className="text-ink-muted text-[13px] mt-0.5">
                {order.recipientEmail}
              </div>
            </Field>

            {isPickup ? (
              <>
                <Field label="Pickup location">
                  {order.pickupLocation && PICKUP_LOCATIONS[order.pickupLocation].label}
                  <div className="text-ink-muted text-[13px] mt-0.5">
                    {order.pickupLocation && PICKUP_LOCATIONS[order.pickupLocation].address}
                  </div>
                </Field>
                <Field label="Pickup date">
                  {new Date(order.deliveryDate).toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Field>
                <Field label="Time slot">
                  {order.pickupTimeSlot && PICKUP_TIME_SLOTS[order.pickupTimeSlot].label}
                </Field>
              </>
            ) : (
              <>
                <Field label="Delivery to">
                  {order.address}
                  <div className="text-ink-muted text-[13px] mt-0.5">
                    Postcode {order.postcode}
                  </div>
                </Field>
                <Field label="Delivery date">
                  {new Date(order.deliveryDate).toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Field>
                <Field label="Delivery window">
                  {order.deliveryWindow && DELIVERY_WINDOWS[order.deliveryWindow].label}
                </Field>
              </>
            )}
          </div>

          {order.message && (
            <>
              <div className="hairline my-6" />
              <Field label="Card message">
                <span className="italic">"{order.message}"</span>
              </Field>
            </>
          )}
        </div>

        {/* Items */}
        <div className="mt-12">
          <div className="eyebrow mb-4">Your order</div>
          <ul className="divide-y divide-border border-y border-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-5 py-5">
                <div className="w-16 h-20 bg-cream flex-shrink-0 overflow-hidden">
                  <img
                    src={
                      Array.isArray(item.product.imgUrl)
                        ? item.product.imgUrl[0]
                        : item.product.imgUrl
                    }
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-display text-charcoal text-[16px] leading-tight">
                    {item.product.name}
                  </div>
                  <div className="text-[12px] text-ink-muted mt-1">
                    Qty {item.quantity} · {formatCurrency(item.unitPrice)} each
                  </div>
                </div>
                <div className="text-charcoal text-[14px] tabular-nums">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 ml-auto max-w-xs space-y-2 text-[14px]">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>Priority delivery</span>
                <span className="tabular-nums">+ {formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="font-display text-charcoal text-[18px]">Total paid</span>
              <span className="font-display text-charcoal text-[18px] tabular-nums">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA back */}
        <div className="mt-16 flex flex-wrap items-center gap-6">
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-charcoal text-bone px-7 py-3 text-[12px] font-medium tracking-eyebrow uppercase hover:bg-terracotta transition-colors"
          >
            Browse more flowers
          </Link>
          <Link
            to="/"
            className="text-charcoal text-sm underline underline-offset-4 decoration-charcoal/30 hover:decoration-charcoal transition"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
