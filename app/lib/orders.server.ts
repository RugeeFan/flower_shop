// Shared order state transitions. Used by both the Stripe webhook and the
// /checkout/success loader so the success page can act as a backstop when the
// webhook is delayed or has not fired yet.
//
// Idempotency, two layers:
//   1. The PENDING -> PAID transition itself is an atomic `updateMany where
//      status = PENDING`. Whichever caller wins, the other no-ops.
//   2. Each email (admin + customer) is gated by its own `*EmailSentAt`
//      column. A webhook replay, a duplicate Stripe event, or a backstop
//      racing the webhook all converge on "one email of each kind".

import { prisma } from "~/lib/prisma.server";
import {
  sendCustomerOrderConfirmation,
  sendNewOrderNotification,
} from "~/lib/email.server";
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
    await dispatchPaidNotifications(orderId);
    return { status: "paid", transitioned: true };
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!existing) return { status: "not_found" };

  // Order was already PAID by a competing caller. Dispatch anyway — the
  // per-email idempotency columns will either send the missing one or
  // skip both. This covers the case where the first transition succeeded
  // but email dispatch crashed before stamping the column.
  await dispatchPaidNotifications(orderId);
  return { status: "paid", transitioned: false };
}

async function dispatchPaidNotifications(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true } },
    },
  });
  if (!order) return;

  const payload = {
    orderId: order.id,
    recipientName: order.recipientName,
    recipientEmail: order.recipientEmail,
    recipientPhone: order.recipientPhone ?? null,
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
  };

  // Customer confirmation — gated by customerEmailSentAt. We claim the
  // slot with updateMany BEFORE sending so concurrent callers can't race
  // past the null check. If sending then fails we clear the marker so a
  // retry (e.g. next webhook delivery) can try again.
  if (order.user?.email && !order.customerEmailSentAt) {
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, customerEmailSentAt: null },
      data: { customerEmailSentAt: new Date() },
    });
    if (claimed.count > 0) {
      try {
        await sendCustomerOrderConfirmation(payload);
      } catch (err) {
        console.error(`[email] Customer confirmation failed for ${orderId}:`, err);
        await prisma.order
          .update({
            where: { id: orderId },
            data: { customerEmailSentAt: null },
          })
          .catch(() => {});
      }
    }
  }

  // Admin notification — same pattern, gated by adminEmailSentAt.
  if (!order.adminEmailSentAt) {
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, adminEmailSentAt: null },
      data: { adminEmailSentAt: new Date() },
    });
    if (claimed.count > 0) {
      try {
        await sendNewOrderNotification(payload);
      } catch (err) {
        console.error(`[email] Admin notification failed for ${orderId}:`, err);
        await prisma.order
          .update({
            where: { id: orderId },
            data: { adminEmailSentAt: null },
          })
          .catch(() => {});
      }
    }
  }
}
