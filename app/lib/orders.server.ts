// Shared order state transitions. Used by both the Stripe webhook and the
// /checkout/success loader so the success page can act as a backstop when the
// webhook is delayed or has not fired yet.
//
// Idempotency: every transition is `updateMany where status = previousState`,
// so whichever caller wins, the other one no-ops and only one notification
// email goes out.

import { prisma } from "~/lib/prisma.server";
import { sendNewOrderNotification } from "~/lib/email.server";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
} from "~/lib/delivery";

export type MarkPaidResult =
  | { status: "paid"; transitioned: boolean }
  | { status: "not_found" };

export async function markOrderPaid(
  orderId: string,
  stripeSessionId: string | null,
): Promise<MarkPaidResult> {
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: {
      status: "PAID",
      ...(stripeSessionId ? { stripeSessionId } : {}),
    },
  });

  if (result.count > 0) {
    await notifyOrderPaid(orderId);
    return { status: "paid", transitioned: true };
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!existing) return { status: "not_found" };

  return { status: "paid", transitioned: false };
}

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
      deliveryWindowLabel: order.deliveryWindow
        ? DELIVERY_WINDOWS[order.deliveryWindow].label
        : null,
      pickupLocationLabel: order.pickupLocation
        ? PICKUP_LOCATIONS[order.pickupLocation].label
        : null,
      pickupLocationAddress: order.pickupLocation
        ? PICKUP_LOCATIONS[order.pickupLocation].address
        : null,
      pickupTimeSlotLabel: order.pickupTimeSlot
        ? PICKUP_TIME_SLOTS[order.pickupTimeSlot].label
        : null,
      items: order.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  } catch (err) {
    // Don't let email failure break the payment acknowledgement path.
    console.error("Failed to send order notification email:", err);
  }
}
