import { Link } from "@remix-run/react";

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-red-500 mb-4">
        Payment Cancelled
      </h1>

      <p className="text-gray-600 mb-8">
        Your payment was not completed. You can return to your cart and try again.
      </p>

      <div className="flex justify-center gap-4">
        <Link
          to="/"
          className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-100 transition text-sm"
        >
          Continue Shopping
        </Link>

        <Link
          to="/checkout"
          className="px-6 py-3 bg-primary text-white rounded hover:bg-primary-dark transition text-sm"
        >
          Retry Checkout
        </Link>
      </div>
    </div>
  );
}
