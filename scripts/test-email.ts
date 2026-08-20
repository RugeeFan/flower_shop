// Manual smoke-test: trigger sendNewOrderNotification on the most recent PAID-or-PENDING order.
// Run: set -a && source .env && set +a && npx tsx scripts/test-email.ts
import { prisma } from "../app/lib/prisma.server";
import { sendNewOrderNotification } from "../app/lib/email.server";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
} from "../app/lib/delivery";

async function main() {
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) {
    console.log("No orders to test with.");
    return;
  }
  console.log(`Sending test notification for order ${order.id}...`);
  await sendNewOrderNotification({
    orderNumber: order.orderNumber,
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
  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
