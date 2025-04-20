import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCartStore } from "~/cart/useCartStore";

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

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>();

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
          console.warn("解析购物车失败", err);
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
        console.warn("恢复表单失败", err);
      }
    }
  }, [reset]);

  useEffect(() => {
    const sub = watch((value) => {
      localStorage.setItem("checkout_form", JSON.stringify(value));
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (cart.length === 0) {
      alert("您的购物车为空，请添加商品后再下单。");
      return;
    }

    const orderId = localStorage.getItem("current_order_id");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          customer: data,
          orderId,
        }),
      });

      const result = await res.json();

      if (result.url) {
        if (result.orderId) {
          localStorage.setItem("current_order_id", result.orderId);
        }
        window.location.href = result.url;
      } else {
        alert("跳转支付失败，请稍后再试。");
      }
    } catch (err) {
      console.error("创建 checkout session 出错:", err);
      alert("创建支付会话失败，请检查网络或稍后再试。");
    }
  };

  if (!hydrated) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 左侧表单 */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="lg:col-span-2 space-y-6 border border-gray-200 shadow-sm p-8 rounded-2xl bg-white"
      >
        <h2 className="text-2xl font-semibold text-gray-800">买家信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input {...register("buyerName", { required: true })} placeholder="姓名" className="input-style" />
          <input {...register("buyerEmail", { required: true })} placeholder="邮箱" className="input-style" />
          <input {...register("buyerPhone", { required: true })} placeholder="手机号" className="input-style md:col-span-2" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 pt-6">收件人信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input {...register("recipientName", { required: true })} placeholder="收件人姓名" className="input-style" />
          <input {...register("recipientEmail", { required: true })} placeholder="收件人邮箱" className="input-style" />
          <input {...register("address", { required: true })} placeholder="地址" className="input-style md:col-span-2" />
          <input {...register("postcode", { required: true })} placeholder="邮政编码" className="input-style" />
          <input {...register("deliveryDate", { required: true })} type="date" className="input-style" />
        </div>

        <textarea {...register("message")} placeholder="卡片留言（可选）" className="input-style min-h-[100px]" />

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? "提交中..." : "确认并前往支付"}
        </button>
      </form>

      {/* 右侧购物车 */}
      <div className="lg:col-span-1 border border-gray-200 shadow-sm p-6 rounded-2xl bg-white sticky top-10 h-fit">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">购物车</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">购物车为空。</p>
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
                <div className="font-semibold text-gray-700">${item.price * item.quantity}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
