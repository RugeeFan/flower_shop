import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCartStore } from "~/zustand/useCartStore";

interface CheckoutFormData {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  recipientName: string;
  recipientEmail: string;
  address: string;
  postcode: string;
  deliveryDate: string;
  message?: string;
}

export default function CheckoutPage() {
  const cart = useCartStore((state) => state.items);
  const setCartItems = useCartStore((state) => state.setItems);
  const [hydrated, setHydrated] = useState(false);
  const [shippingFee, setShippingFee] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>();

  const postcode = watch("postcode");

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && cart.length === 0) {
      const raw = localStorage.getItem("cart-storage");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.state?.items?.length > 0) {
            setCartItems(parsed.state.items);
          }
        } catch (err) {
          console.warn("Failed to parse cart:", err);
        }
      }
    }
  }, [hydrated, cart.length]);

  useEffect(() => {
    const saved = localStorage.getItem("checkout_form");
    if (saved) {
      try {
        reset(JSON.parse(saved));
      } catch (err) {
        console.warn("Failed to restore form:", err);
      }
    }
  }, [reset]);

  useEffect(() => {
    const sub = watch((value) => {
      localStorage.setItem("checkout_form", JSON.stringify(value));
    });
    return () => sub.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (postcode && postcode.length >= 4) {
      const controller = new AbortController();
      fetch(`/api/get-shipping-fee?postcode=${postcode}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.price) {
            setShippingFee(data.price);
          } else {
            setShippingFee(null);
          }
        })
        .catch(() => setShippingFee(null));
      return () => controller.abort();
    }
  }, [postcode]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const orderId = localStorage.getItem("current_order_id");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, customer: data, orderId }),
      });

      const result = await res.json();

      if (result.url) {
        if (result.orderId) {
          localStorage.setItem("current_order_id", result.orderId);
        }
        window.location.href = result.url;
      } else {
        alert("Redirect to payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("Failed to create checkout session. Please check your network.");
    }
  };

  if (!hydrated) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="lg:col-span-2 space-y-6 border border-gray-200 shadow-sm p-8 rounded-2xl bg-white"
      >
        <h2 className="text-2xl font-semibold text-gray-800">Buyer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="buyerName" className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input id="buyerName" {...register("buyerName", { required: true })} className="input-style" />
          </div>
          <div className="space-y-1">
            <label htmlFor="buyerEmail" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input id="buyerEmail" {...register("buyerEmail", { required: true })} className="input-style" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label htmlFor="buyerPhone" className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input id="buyerPhone" {...register("buyerPhone", { required: true })} className="input-style" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 pt-6">Recipient Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="recipientName" className="text-sm font-medium text-gray-700">
              Recipient Name
            </label>
            <input id="recipientName" {...register("recipientName", { required: true })} className="input-style" />
          </div>
          <div className="space-y-1">
            <label htmlFor="recipientEmail" className="text-sm font-medium text-gray-700">
              Recipient Email
            </label>
            <input id="recipientEmail" {...register("recipientEmail", { required: true })} className="input-style" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label htmlFor="address" className="text-sm font-medium text-gray-700">
              Delivery Address
            </label>
            <input id="address" {...register("address", { required: true })} className="input-style" />
          </div>
          <div className="space-y-1">
            <label htmlFor="postcode" className="text-sm font-medium text-gray-700">
              Postcode
            </label>
            <input id="postcode" {...register("postcode", { required: true })} className="input-style" />
          </div>
          <div className="space-y-1">
            <label htmlFor="deliveryDate" className="text-sm font-medium text-gray-700">
              Delivery Date
            </label>
            <input id="deliveryDate" type="date" {...register("deliveryDate", { required: true })} className="input-style" />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="message" className="text-sm font-medium text-gray-700">
            Card Message (Optional)
          </label>
          <textarea
            id="message"
            {...register("message")}
            className="input-style min-h-[100px]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? "Submitting..." : "Confirm and Proceed to Pay"}
        </button>
      </form>

      {/* Cart Summary */}
      <div className="lg:col-span-1 border border-gray-200 shadow-sm p-6 rounded-2xl bg-white sticky top-10 h-fit">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Shopping Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <ul className="space-y-4">
            {cart.map((item) => (
              <li key={item.id} className="flex gap-4 items-center">
                <img
                  src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-500">x {item.quantity}</div>
                </div>
                <div className="font-semibold text-gray-700">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}

        {shippingFee !== null && (
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between text-gray-700 mb-2">
              <span>Shipping</span>
              <span>${shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg text-gray-900">
              <span>Total</span>
              <span>
                $
                {(
                  cart.reduce((sum, item) => sum + item.price * item.quantity, 0) +
                  shippingFee
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
