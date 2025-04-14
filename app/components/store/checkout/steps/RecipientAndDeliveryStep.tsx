// app/components/checkout/steps/RecipientAndDeliveryStep.tsx
import { useFormContext } from "react-hook-form";

export default function RecipientAndDeliveryStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Recipient Name</label>
        <input
          type="text"
          {...register("recipientName", { required: "Recipient name is required" })}
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:border-black"
        />
        {errors.recipientName && (
          <p className="text-red-500 text-sm mt-1">{errors.recipientName.message}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Delivery Address</label>
        <input
          type="text"
          {...register("deliveryAddress", { required: "Delivery address is required" })}
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:border-black"
        />
        {errors.deliveryAddress && (
          <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress.message}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Delivery Date</label>
        <input
          type="date"
          {...register("deliveryDate", { required: "Please select a delivery date" })}
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:border-black"
        />
        {errors.deliveryDate && (
          <p className="text-red-500 text-sm mt-1">{errors.deliveryDate.message}</p>
        )}
      </div>
    </div>
  );
}
