import { useEffect } from "react";

export default function CheckoutCancel() {
  useEffect(() => {
    // 清空购物车
    localStorage.removeItem("cart");
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="mb-8">Your payment was cancelled and no charge was made.</p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <p className="text-yellow-700">
            If you experienced any issues during checkout, please try again or contact our support team.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <a
            href="/checkout"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Try Again
          </a>
          <a
            href="/"
            className="inline-block bg-white text-black border border-black px-6 py-3 rounded-lg hover:bg-gray-100 transition"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
} 