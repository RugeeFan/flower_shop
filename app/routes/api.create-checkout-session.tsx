import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { cart, customer, orderId } = body;

  if (!cart || cart.length === 0 || !customer) {
    return json({ error: "无效请求" }, { status: 400 });
  }

  // 1️⃣ 查找或创建 User（买花人）
  const buyer = await prisma.user.upsert({
    where: { email: customer.buyerEmail },
    update: {
      name: customer.buyerName,
      phone: customer.buyerPhone,
    },
    create: {
      email: customer.buyerEmail,
      name: customer.buyerName,
      phone: customer.buyerPhone,
    },
  });

  // 2️⃣ 如果已有未完成订单则复用，否则新建订单
  let order;

  if (orderId) {
    order = await prisma.order.findUnique({ where: { id: orderId } });
  }

  if (!order) {
    order = await prisma.order.create({
      data: {
        userId: buyer.id,
        recipientName: customer.recipientName,
        recipientEmail: customer.recipientEmail,
        address: customer.address,
        postcode: customer.postcode,
        deliveryDate: new Date(customer.deliveryDate),
        message: customer.message || "",
        status: "PENDING",
        totalAmount: cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
        items: {
          create: cart.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        },
      },
    });
  }

  // 3️⃣ 创建 Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/checkout`,
    line_items: cart.map((item: any) => ({
      price_data: {
        currency: "aud",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    metadata: {
      orderId: order.id,
    },
  });

  return json({ url: session.url, orderId: order.id });
}
