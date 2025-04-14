// app/components/checkout/steps/DeliveryOptionsStep.tsx
import { useFormContext } from "react-hook-form";

export default function DeliveryOptionsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 font-medium">Delivery Method</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="standard"
              {...register("deliveryMethod", { required: "Please select a delivery method" })}
              className="accent-black"
            />
            Standard Delivery (Free, 2-3 business days)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="express"
              {...register("deliveryMethod")}
              className="accent-black"
            />
            Express Delivery ($10, 1 business day)
          </label>
        </div>
        {errors.deliveryMethod && (
          <p className="text-red-500 text-sm mt-1">
            {errors.deliveryMethod.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Preferred Delivery Time</label>
        <select
          {...register("deliveryTime")}
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:border-black"
        >
          <option value="">No preference</option>
          <option value="morning">Morning (9am - 12pm)</option>
          <option value="afternoon">Afternoon (12pm - 5pm)</option>
          <option value="evening">Evening (5pm - 8pm)</option>
        </select>
      </div>
    </div>
  );
}
