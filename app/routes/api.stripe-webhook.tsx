import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { prisma } from "~/lib/prisma.server";
import { stripe } from "~/lib/stripe.server";
import { markOrderPaid } from "~/lib/orders.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing Stripe signature", { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        console.error("Missing orderId in session metadata.");
        break;
      }

      const result = await markOrderPaid(orderId, session.id);
      if (result.status === "not_found") {
        console.warn(`Webhook: order ${orderId} not found`);
      } else if (result.transitioned) {
        console.log(`Order ${orderId} marked as PAID by webhook`);
      } else {
        console.log(`Order ${orderId} already PAID (success-page backstop won the race)`);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) break;
      const result = await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (result.count > 0) console.log(`Order ${orderId} marked as CANCELLED`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response("Webhook handled", { status: 200 });
};
