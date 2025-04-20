import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { prisma } from "~/lib/prisma.server";
import { stripe } from "~/lib/stripe.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const body = await request.text(); // 必须用 text 获取

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // 处理不同的 Stripe 事件
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.error("Missing orderId in session metadata.");
        break;
      }

      // 更新订单状态为 PAID
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      console.log(`Order ${orderId} marked as PAID`);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (!orderId) break;

      // 订单状态更新为 CANCELLED
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      console.log(`Order ${orderId} marked as CANCELLED`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response("Webhook handled", { status: 200 });
};
