// app/routes/api/create-checkout-session.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil", // 你可以根据提示改成最新的
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const { cart, customer } = body;

    if (!cart || cart.length === 0) {
      return json({ error: "购物车为空" }, { status: 400 });
    }

    // Stripe 要求的 line_items 格式
    const lineItems = cart.map((item: any) => ({
      price_data: {
        currency: "aud", // 可根据需要改
        product_data: {
          name: item.name,
          images: item.imgUrl?.length ? [item.imgUrl[0]] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe 用的是分
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/checkout/cancel`,
      customer_email: customer?.email,
      metadata: {
        // 发件人信息
        name: customer?.name || "",
        phone: customer?.phone || "",
        email: customer?.email || "",

        // 收件人信息
        recipientName: customer?.recipientName || "",
        deliveryAddress: customer?.deliveryAddress || "",
        deliveryDate: customer?.deliveryDate || "",

        // 配送选项
        deliveryMethod: customer?.deliveryMethod || "",
        deliveryTime: customer?.deliveryTime || "",

        // 消息卡片
        message: customer?.message || "",
        signature: customer?.signature || "",
      },
    });

    return json({ url: session.url });
  } catch (err: any) {
    console.error("创建 Checkout 会话失败：", err);
    return json({ error: err.message }, { status: 500 });
  }
}
