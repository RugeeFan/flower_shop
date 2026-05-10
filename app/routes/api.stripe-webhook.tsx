import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { prisma } from "~/lib/prisma.server";
import { stripe } from "~/lib/stripe.server";
import { sendNewOrderNotification } from "~/lib/email.server";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
} from "~/lib/delivery";

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

      const result = await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "PAID", stripeSessionId: session.id },
      });

      if (result.count > 0) {
        console.log(`Order ${orderId} marked as PAID`);
        await notifyOrderPaid(orderId);
      } else {
        console.log(`Order ${orderId} already in terminal state, skipped`);
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

async function notifyOrderPaid(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });
    if (!order) return;

    await sendNewOrderNotification({
      orderId: order.id,
      recipientName: order.recipientName,
      recipientEmail: order.recipientEmail,
      buyerEmail: order.user?.email ?? null,
      buyerName: order.user?.name ?? null,
      buyerPhone: order.user?.phone ?? null,
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      deliveryDate: order.deliveryDate,
      message: order.message,
      deliveryType: order.deliveryType,
      address: order.address,
      postcode: order.postcode,
      deliveryWindowLabel: order.deliveryWindow ? DELIVERY_WINDOWS[order.deliveryWindow].label : null,
      pickupLocationLabel: order.pickupLocation ? PICKUP_LOCATIONS[order.pickupLocation].label : null,
      pickupLocationAddress: order.pickupLocation ? PICKUP_LOCATIONS[order.pickupLocation].address : null,
      pickupTimeSlotLabel: order.pickupTimeSlot ? PICKUP_TIME_SLOTS[order.pickupTimeSlot].label : null,
      items: order.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  } catch (err) {
    // Don't let email failure break the webhook acknowledgement
    console.error("Failed to send order notification email:", err);
  }
}
