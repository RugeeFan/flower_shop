import { useState } from "react";
import CheckoutStepper from "~/components/store/checkout/CheckoutStepper";
import OrderSummary from "~/components/store/checkout/OrderSummary";

export default function Checkout() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white py-8 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900">Secure Checkout</h1>
          <p className="mt-2 text-center text-gray-600 max-w-2xl mx-auto">
            Same day flower delivery to Sydney suburbs, Monday to Saturday. 
            <span className="block mt-1">
              Urgent Delivery? Questions? Call Us On: <a href="tel:0412345678" className="text-primary font-medium hover:underline">0412 345 678</a>
            </span>
          </p>
        </div>
      </div>
      
      {/* Payment Methods Banner */}
      <div className="bg-white py-4 border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <p className="font-medium text-gray-700">Guaranteed</p>
              <p className="font-bold text-gray-900">Safe Checkout</p>
            </div>
            <div className="flex gap-3 sm:gap-5 items-center">
              <img alt="MasterCard" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/mastercard-2789e991b7ade46039eafc9c2dee83e7713eddb3_bwvc1z.svg" />
              <img alt="Visa" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/visa-60cf74cbad7400ab7427cd41529af15330af6383_spuac2.svg" />
              <img alt="Amex" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704112/amex-07ada099123d628aca142a88f03a41bf0af62076_br4ty5.svg" />
              <img alt="PayPal" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704095/paypal-2db521f81867a9e2879753ee1a4889d0ef6af0e8_vfncb8.svg" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Checkout Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form - Takes 2/3 of the space on desktop */}
          <div className="lg:col-span-2">
            <CheckoutStepper />
          </div>
          
          {/* Order Summary - Takes 1/3 of the space on desktop */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <OrderSummary />
              
              {/* Trust Badges */}
              <div className="mt-6 bg-white p-4 rounded-md border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Same Day Delivery Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">100% Satisfaction Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
