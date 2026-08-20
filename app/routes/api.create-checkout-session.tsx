import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";
import { stripe, isStripeDevMode } from "~/lib/stripe.server";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
  isPickupSlotAvailable,
  type DeliveryWindowKey,
  type PickupLocationKey,
  type PickupTimeSlotKey,
} from "~/lib/delivery";
import { calculateDeliveryFee } from "~/lib/delivery.server";
import { markOrderPaid } from "~/lib/orders.server";
import { withOrderNumberRetry } from "~/lib/order-number.server";

interface CartLine {
  id: string;
  quantity: number;
}

interface Customer {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  message?: string;

  deliveryType: "DELIVERY" | "PICKUP";

  // delivery
  address?: string;
  postcode?: string;
  deliveryDate?: string;
  deliveryWindow?: DeliveryWindowKey;

  // pickup
  pickupLocation?: PickupLocationKey;
  pickupDate?: string;
  pickupTimeSlot?: PickupTimeSlotKey;
}

export async function action({ request }: ActionFunctionArgs) {
  const body = (await request.json()) as {
    cart?: CartLine[];
    customer?: Customer;
    orderId?: string | null;
    confirmDuplicate?: boolean;
  };
  const { cart, customer, orderId, confirmDuplicate } = body;

  if (!cart || cart.length === 0 || !customer) {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  const baseRequired: (keyof Customer)[] = [
    "buyerName",
    "buyerEmail",
    "buyerPhone",
    "recipientName",
    "recipientEmail",
    "recipientPhone",
  ];
  for (const f of baseRequired) {
    if (!customer[f] || typeof customer[f] !== "string") {
      return json({ error: `Missing field: ${f}` }, { status: 400 });
    }
  }

  if (customer.deliveryType !== "DELIVERY" && customer.deliveryType !== "PICKUP") {
    return json({ error: "Invalid fulfilment type" }, { status: 400 });
  }

  // Branch-specific validation + scheduled date
  let scheduledDate: Date;
  let zoneFee = 0;
  let windowSurcharge = 0;
  let deliveryWindow: DeliveryWindowKey | null = null;
  let pickupLocation: PickupLocationKey | null = null;
  let pickupTimeSlot: PickupTimeSlotKey | null = null;
  let address: string | null = null;
  let postcode: string | null = null;

  if (customer.deliveryType === "DELIVERY") {
    if (!customer.address || !customer.postcode || !customer.deliveryDate || !customer.deliveryWindow) {
      return json({ error: "Missing delivery details" }, { status: 400 });
    }
    if (!(customer.deliveryWindow in DELIVERY_WINDOWS)) {
      return json({ error: "Invalid delivery window" }, { status: 400 });
    }
    const d = new Date(customer.deliveryDate);
    if (isNaN(d.getTime())) {
      return json({ error: "Invalid delivery date" }, { status: 400 });
    }
    scheduledDate = d;
    deliveryWindow = customer.deliveryWindow;
    address = customer.address.trim();
    postcode = customer.postcode.trim();

    // Single source of truth for the shipping fee. Shared with the quote
    // endpoint so the cart total, order row, and Stripe receipt all match.
    const fee = await calculateDeliveryFee({
      deliveryType: "DELIVERY",
      postcode,
      deliveryWindow,
    });
    if (!fee.ok) {
      const status = fee.code === "UNSUPPORTED_POSTCODE" ? 422 : 400;
      return json({ error: fee.error, code: fee.code }, { status });
    }
    zoneFee = fee.zoneFee;
    windowSurcharge = fee.windowSurcharge;
  } else {
    if (!customer.pickupLocation || !customer.pickupDate || !customer.pickupTimeSlot) {
      return json({ error: "Missing pickup details" }, { status: 400 });
    }
    if (!(customer.pickupLocation in PICKUP_LOCATIONS)) {
      return json({ error: "Invalid pickup location" }, { status: 400 });
    }
    if (!(customer.pickupTimeSlot in PICKUP_TIME_SLOTS)) {
      return json({ error: "Invalid pickup time slot" }, { status: 400 });
    }
    if (!isPickupSlotAvailable(customer.pickupDate, customer.pickupTimeSlot, new Date())) {
      return json(
        {
          error:
            "Selected pickup slot is no longer available. Orders after 6 PM are available from 11 AM next day.",
        },
        { status: 400 },
      );
    }
    // Store the slot start as deliveryDate for sorting/display
    const [y, m, dd] = customer.pickupDate.split("-").map(Number);
    scheduledDate = new Date(y, (m ?? 1) - 1, dd ?? 1, PICKUP_TIME_SLOTS[customer.pickupTimeSlot].startHour, 0, 0, 0);
    pickupLocation = customer.pickupLocation;
    pickupTimeSlot = customer.pickupTimeSlot;
  }

  // Cart validation — never trust client-side prices; quantities are bounded.
  const MAX_QTY_PER_LINE = 100;
  const cleanCart = cart
    .map((l) => ({ id: String(l.id ?? "").trim(), quantity: Math.floor(Number(l.quantity)) }))
    .filter(
      (l) =>
        l.id &&
        Number.isFinite(l.quantity) &&
        l.quantity > 0 &&
        l.quantity <= MAX_QTY_PER_LINE,
    );
  if (cleanCart.length === 0) {
    return json({ error: "Invalid cart" }, { status: 400 });
  }
  // Dedupe: if a client posts the same id twice, sum the quantities so the
  // length-vs-DB-row count check below stays meaningful.
  const qtyById = new Map<string, number>();
  for (const l of cleanCart) {
    qtyById.set(l.id, (qtyById.get(l.id) ?? 0) + l.quantity);
  }
  const productIds = Array.from(qtyById.keys());
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true },
  });
  if (products.length !== productIds.length) {
    return json({ error: "Cart contains invalid products" }, { status: 400 });
  }
  const lineItems = products.map((p) => ({
    product: p, // price comes from DB, never from request
    quantity: qtyById.get(p.id)!,
  }));
  const subtotal = lineItems.reduce((s, l) => s + l.product.price * l.quantity, 0);
  const deliveryFee = zoneFee + windowSurcharge;
  const totalAmount = subtotal + deliveryFee;

  // Duplicate-order guard: same buyer email + identical (productId, quantity)
  // set, paid in the last hour, with no explicit user confirmation.
  if (!confirmDuplicate) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const newSig = Array.from(qtyById.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, q]) => `${id}:${q}`)
      .join(",");
    const recentPaid = await prisma.order.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: oneHourAgo },
        user: { email: customer.buyerEmail },
      },
      include: { items: { select: { productId: true, quantity: true } } },
      orderBy: { createdAt: "desc" },
    });
    const dup = recentPaid.find((o) => {
      const sig = o.items
        .map((i) => [i.productId, i.quantity] as const)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, q]) => `${id}:${q}`)
        .join(",");
      return sig === newSig;
    });
    if (dup) {
      return json({
        duplicate: true,
        message:
          "You just paid for an identical order. Do you want to pay again?",
        lastOrderId: dup.id,
        lastOrderAt: dup.createdAt.toISOString(),
      });
    }
  }

  // Reuse PENDING order only if it belongs to a real user whose email matches
  // the request's buyerEmail. Guest orders (userId = null) cannot be reused —
  // an attacker who guesses an orderId could otherwise overwrite it.
  let order: { id: string } | null = null;
  if (orderId) {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (
      existing &&
      existing.status === "PENDING" &&
      existing.userId &&
      existing.user &&
      existing.user.email === customer.buyerEmail
    ) {
      await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });
      order = await prisma.order.update({
        where: { id: existing.id },
        data: {
          recipientName: customer.recipientName,
          recipientEmail: customer.recipientEmail,
          recipientPhone: customer.recipientPhone,
          address,
          postcode,
          deliveryDate: scheduledDate,
          message: customer.message || "",
          totalAmount,
          deliveryFee,
          deliveryType: customer.deliveryType,
          pickupLocation,
          pickupTimeSlot,
          deliveryWindow,
          items: {
            create: lineItems.map((l) => ({
              productId: l.product.id,
              quantity: l.quantity,
              unitPrice: l.product.price,
            })),
          },
        },
        select: { id: true },
      });
    }
  }

  if (!order) {
    let buyer = await prisma.user.findUnique({
      where: { email: customer.buyerEmail },
      select: { id: true },
    });
    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          email: customer.buyerEmail,
          name: customer.buyerName,
          phone: customer.buyerPhone,
        },
        select: { id: true },
      });
    }
    order = await withOrderNumberRetry((orderNumber) =>
      prisma.order.create({
        data: {
          orderNumber,
          userId: buyer.id,
          recipientName: customer.recipientName,
          recipientEmail: customer.recipientEmail,
          recipientPhone: customer.recipientPhone,
          address,
          postcode,
          deliveryDate: scheduledDate,
          message: customer.message || "",
          status: "PENDING",
          totalAmount,
          deliveryFee,
          deliveryType: customer.deliveryType,
          pickupLocation,
          pickupTimeSlot,
          deliveryWindow,
          items: {
            create: lineItems.map((l) => ({
              productId: l.product.id,
              quantity: l.quantity,
              unitPrice: l.product.price,
            })),
          },
        },
        select: { id: true },
      }),
    );
  }

  // ─── DEV-MODE BRANCH ──────────────────────────────────────────────────
  // Triggered when STRIPE_SECRET_KEY is empty or contains "placeholder".
  // Bypasses Stripe entirely, marks order PAID, logs JSON + notifies email,
  // returns a /checkout/success?devOrderId=... URL.
  // Switch off by setting a real STRIPE_SECRET_KEY in env — no code change.
  // The real Stripe flow below runs unchanged when that env var is real.
  // ──────────────────────────────────────────────────────────────────────
  if (isStripeDevMode()) {
    console.log("\n=== [DEV MODE] Stripe bypassed — order marked PAID ===");
    console.log(JSON.stringify({
      orderId: order.id,
      buyer: { name: customer.buyerName, email: customer.buyerEmail, phone: customer.buyerPhone },
      recipient: { name: customer.recipientName, email: customer.recipientEmail, phone: customer.recipientPhone },
      fulfilment: customer.deliveryType === "PICKUP"
        ? { type: "PICKUP", location: pickupLocation, slot: pickupTimeSlot, date: scheduledDate.toISOString() }
        : { type: "DELIVERY", address, postcode, window: deliveryWindow, date: scheduledDate.toISOString() },
      items: lineItems.map((l) => ({ name: l.product.name, qty: l.quantity, unit: l.product.price })),
      subtotal,
      zoneFee,
      windowSurcharge,
      deliveryFee,
      totalAmount,
    }, null, 2));
    console.log("=========================================================\n");

    // Run the same PAID transition (with admin + customer emails, all
    // idempotent) we run for real Stripe payments. Sharing the path means
    // dev-mode keeps drifting bug-for-bug with production.
    await markOrderPaid(order.id, null);

    return json({
      url: `${process.env.BASE_URL}/checkout/success?devOrderId=${order.id}`,
      orderId: order.id,
    });
  }

  // ─── REAL STRIPE FLOW (production) ────────────────────────────────────
  // Untouched canonical path: build line items (products + optional priority
  // surcharge), create a Checkout Session, return its hosted URL. The
  // /api/stripe-webhook route flips the order to PAID once Stripe fires
  // checkout.session.completed.
  // ──────────────────────────────────────────────────────────────────────
  const stripeLineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] = lineItems.map((l) => ({
    price_data: {
      currency: "aud",
      product_data: { name: l.product.name },
      unit_amount: Math.round(l.product.price * 100),
    },
    quantity: l.quantity,
  }));
  // Shipping fee is two parts kept as separate Stripe line items so the
  // receipt shows what the customer is paying for:
  //   zoneFee         — postcode-based ShippingZone fee (computed server-side
  //                     in calculateDeliveryFee, never trusted from client)
  //   windowSurcharge — PRIORITY delivery upcharge from DELIVERY_WINDOWS
  // Stripe rejects $0 line items, so each is pushed only when strictly > 0.
  // PICKUP orders skip both — calculateDeliveryFee returns 0 for that branch.
  if (zoneFee > 0) {
    stripeLineItems.push({
      price_data: {
        currency: "aud",
        product_data: { name: "Delivery" },
        unit_amount: Math.round(zoneFee * 100),
      },
      quantity: 1,
    });
  }
  if (windowSurcharge > 0) {
    stripeLineItems.push({
      price_data: {
        currency: "aud",
        product_data: { name: "Priority Delivery (within 4 hours)" },
        unit_amount: Math.round(windowSurcharge * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/checkout`,
    line_items: stripeLineItems,
    metadata: { orderId: order.id },
  });

  return json({ url: session.url, orderId: order.id });
}
