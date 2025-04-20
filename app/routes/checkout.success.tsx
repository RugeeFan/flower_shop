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
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Payment Successful 🎉</h1>

      <div className="space-y-4">
        <div>Order ID: {order.id}</div>
        <div>Recipient: {order.recipientName}</div>
        <div>Email: {order.recipientEmail}</div>
        <div>Address: {order.address}</div>
        <div>Delivery Date: {new Date(order.deliveryDate).toLocaleDateString()}</div>
        <div>Total Paid: ${order.totalAmount.toFixed(2)}</div>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-3">Order Items:</h2>

      <ul className="space-y-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between border-b pb-2">
            <div>{item.product.name}</div>
            <div>x{item.quantity}</div>
            <div>${(item.unitPrice * item.quantity).toFixed(2)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
