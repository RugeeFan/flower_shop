// app/components/store/checkout/steps/PaymentStep.tsx
import { useFormContext } from "react-hook-form";
import { getCartFromLocalStorage } from "~/utils/cartUtils";

export default function PaymentStep() {
  const { getValues } = useFormContext();

  // 获取购物车数据用于显示
  const cart = getCartFromLocalStorage();
  const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h3 className="font-medium text-lg mb-2">订单摘要</h3>
        <div className="space-y-2">
          {cart.map((item: any, index: number) => (
            <div key={index} className="flex justify-between">
              <span>{item.name} × {item.quantity || 1}</span>
              <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-medium mt-4">
          <span>小计</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>点击"Place Order"按钮完成订单并前往Stripe支付页面。</p>
        <p>您的支付信息将通过Stripe安全处理。</p>
      </div>
    </div>
  );
}
