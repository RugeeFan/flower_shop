import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { stripe } from "~/lib/stripe.server";
import { prisma } from "~/lib/prisma.server";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    throw new Response("Missing session_id", { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session.metadata?.orderId) {
    throw new Response("Order Not Found", { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: session.metadata.orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Response("Order Not Found", { status: 404 });
  }

  return json({ order });
};

export default function CheckoutSuccessPage() {
  const { order } = useLoaderData<typeof loader>();
  useEffect(() => {
    localStorage.removeItem("current_order_id");
  }, []);

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const shippingFee = order.totalAmount - subtotal;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
        Payment Successful 🎉
      </h1>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Order Information
        </h2>

        <div className="text-gray-700 text-sm space-y-1">
          <div><span className="font-medium">Order ID:</span> {order.id}</div>
          <div><span className="font-medium">Recipient:</span> {order.recipientName}</div>
          <div><span className="font-medium">Email:</span> {order.recipientEmail}</div>
          <div><span className="font-medium">Address:</span> {order.address}</div>
          <div><span className="font-medium">Delivery Date:</span> {new Date(order.deliveryDate).toLocaleDateString()}</div>
          <div><span className="font-medium">Card Message:</span> {order.message || "—"}</div>
        </div>

        <div className="border-t pt-4 mt-4 space-y-1 text-gray-800 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Fee</span>
            <span>${shippingFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-3">
            <span>Total Paid</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Order Items</h2>
        <ul className="space-y-4">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center border-b pb-2 text-sm text-gray-700"
            >
              <div className="flex-1">{item.product.name}</div>
              <div className="w-12 text-center">x{item.quantity}</div>
              <div className="w-24 text-right">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
