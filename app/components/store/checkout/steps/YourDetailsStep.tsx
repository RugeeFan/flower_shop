import { useFormContext } from "react-hook-form";

export default function YourDetailsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label 
            htmlFor="firstName" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            First Name
          </label>
          <input 
            id="firstName" 
            className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            {...register("firstName", { required: "First name is required" })} 
          />
          {errors.firstName && (
            <p className="text-sm text-red-500 mt-1">{errors.firstName.message as string}</p>
          )}
        </div>
        
        <div>
          <label 
            htmlFor="lastName" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Last Name
          </label>
          <input 
            id="lastName" 
            className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            {...register("lastName", { required: "Last name is required" })} 
          />
          {errors.lastName && (
            <p className="text-sm text-red-500 mt-1">{errors.lastName.message as string}</p>
          )}
        </div>
      </div>
      
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Invalid email address",
            },
          })}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="phone" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.phone ? 'border-red-300' : 'border-gray-300'
          }`}
          {...register("phone", {
            required: "Phone number is required",
          })}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message as string}</p>
        )}
      </div>
    </div>
  );
}
