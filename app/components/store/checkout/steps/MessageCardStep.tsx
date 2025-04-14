// app/components/checkout/steps/MessageCardStep.tsx
import { useFormContext } from "react-hook-form";

export default function MessageCardStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Message</label>
        <textarea
          {...register("message")}
          rows={4}
          placeholder="Write a personal message (optional)"
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:border-black resize-none"
        />
        {errors.message && (
          <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Signature</label>
        <input
          type="text"
          {...register("signature")}
          placeholder="From, Your name"
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:border-black"
        />
      </div>
    </div>
  );
}
