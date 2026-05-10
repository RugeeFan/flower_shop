import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { stripe } from "~/lib/stripe.server";
import { prisma } from "~/lib/prisma.server";
import { useEffect } from "react";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
} from "~/lib/delivery";
import { useCartStore } from "~/zustand/useCartStore";

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
  } else {
    throw new Response("Missing session_id", { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Response("Order Not Found", { status: 404 });
  if (devMode && order.status !== "PAID") {
    throw new Response("Order not in PAID state", { status: 402 });
  }

  return json({ order, devMode });
};

export default function CheckoutSuccessPage() {
  const { order, devMode } = useLoaderData<typeof loader>();
  const clearCart = useCartStore((state) => state.clearCart);
  useEffect(() => {
    clearCart();
    localStorage.removeItem("current_order_id");
    localStorage.removeItem("checkout_form");
    localStorage.removeItem("cart");
  }, [clearCart]);

  const isPickup = order.deliveryType === "PICKUP";

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      {devMode && (
        <div className="mb-4 p-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-900 text-sm">
          <strong>DEV MODE:</strong> Stripe was bypassed. No real charge was made — order data was saved and notification email was sent (or logged to console if SMTP is not configured).
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        {devMode ? "Order Created (dev) ✅" : "Payment Successful 🎉"}
      </h1>

      <div className="space-y-2 text-gray-800 bg-white border rounded-lg p-5">
        <div><strong>Order ID:</strong> {order.id}</div>
        <div><strong>Recipient:</strong> {order.recipientName}</div>
        <div><strong>Email:</strong> {order.recipientEmail}</div>

        {isPickup ? (
          <>
            <div className="pt-2 border-t mt-2">
              <strong>Store Pickup</strong>
            </div>
            <div>
              <strong>Location:</strong>{" "}
              {order.pickupLocation && PICKUP_LOCATIONS[order.pickupLocation].label}
            </div>
            <div>
              <strong>Address:</strong>{" "}
              {order.pickupLocation && PICKUP_LOCATIONS[order.pickupLocation].address}
            </div>
            <div>
              <strong>Pickup Date:</strong>{" "}
              {new Date(order.deliveryDate).toLocaleDateString()}
            </div>
            <div>
              <strong>Time Slot:</strong>{" "}
              {order.pickupTimeSlot && PICKUP_TIME_SLOTS[order.pickupTimeSlot].label}
            </div>
          </>
        ) : (
          <>
            <div className="pt-2 border-t mt-2">
              <strong>Local Delivery</strong>
            </div>
            <div><strong>Address:</strong> {order.address}</div>
            <div><strong>Postcode:</strong> {order.postcode}</div>
            <div>
              <strong>Delivery Date:</strong>{" "}
              {new Date(order.deliveryDate).toLocaleDateString()}
            </div>
            <div>
              <strong>Delivery Window:</strong>{" "}
              {order.deliveryWindow && DELIVERY_WINDOWS[order.deliveryWindow].label}
            </div>
          </>
        )}

        {order.message && (
          <div className="pt-2 border-t mt-2">
            <strong>Card Message:</strong> {order.message}
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-900">Order Items</h2>
      <ul className="space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between border-b pb-2 text-gray-800">
            <div>{item.product.name}</div>
            <div>x{item.quantity}</div>
            <div>${(item.unitPrice * item.quantity).toFixed(2)}</div>
          </li>
        ))}
      </ul>

      {order.deliveryFee > 0 && (
        <div className="mt-3 flex justify-between text-gray-700">
          <span>Priority delivery</span>
          <span>+ ${order.deliveryFee.toFixed(2)}</span>
        </div>
      )}
      <div className="mt-3 flex justify-between text-lg font-semibold text-gray-900">
        <span>Total Paid</span>
        <span>${order.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
