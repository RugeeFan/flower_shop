// app/components/checkout/CheckoutStepper.tsx
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import StepAccordion from "./StepAccordion";
import { getCartFromLocalStorage } from "~/utils/cartUtils";

import YourDetailsStep from "./steps/YourDetailsStep";
import RecipientAndDeliveryStep from "./steps/RecipientAndDeliveryStep";
import MessageCardStep from "./steps/MessageCardStep";
import DeliveryOptionsStep from "./steps/DeliveryOptionsStep";
import PaymentStep from "./steps/PaymentStep";

export default function CheckoutStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const methods = useForm({ mode: "onBlur" });

  const steps = [
    { title: "Your details", component: <YourDetailsStep /> },
    { title: "Recipient and delivery details", component: <RecipientAndDeliveryStep /> },
    { title: "Message card (optional)", component: <MessageCardStep /> },
    { title: "Delivery options", component: <DeliveryOptionsStep /> },
    { title: "Payment", component: <PaymentStep /> },
  ];

  const handleNext = async () => {
    const isValid = await methods.trigger(); // validate current step
    if (!isValid) return;
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      // 最后一步，处理支付
      const formData = methods.getValues();
      const cart = getCartFromLocalStorage();
      
      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart, customer: formData }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url; // 跳转到 Stripe 付款页面
        } else {
          console.error("未获得 Stripe Checkout URL", data);
          alert("支付跳转失败，请稍后重试");
        }
      } catch (err) {
        console.error("创建结账会话失败", err);
        alert("发生错误，无法创建支付会话");
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <StepAccordion
            key={index}
            step={index + 1}
            title={step.title}
            open={activeStep === index}
            onToggle={() => setActiveStep(index)}
          >
            {step.component}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleNext}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition"
              >
                {index === steps.length - 1 ? "Place Order" : "Continue"}
              </button>
            </div>
          </StepAccordion>
        ))}
      </form>
    </FormProvider>
  );
}
