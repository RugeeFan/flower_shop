import { useSearchParams } from "@remix-run/react";
import { stripe } from "~/utils/stripe";
import { json, LoaderFunctionArgs } from "@remix-run/node";

// 服务器端加载器函数获取会话信息
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return json({ error: "No session ID provided" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return json({ session });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
}

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
        <p className="mb-8">Your payment was successful and your order is being processed.</p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <p className="text-green-700">Order ID: {sessionId}</p>
          <p className="text-sm text-green-600 mt-2">
            A confirmation email has been sent to your email address.
          </p>
        </div>

        <a
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
} 