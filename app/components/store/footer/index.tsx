import { footerLinks, footerPopular } from "~/data/homepage";

export default function Footer() {
  return <div>
    <div className="pt-6 md:pt-10 pb-10 md:pb-20 px-4 md:px-20 lg:px-40 flex flex-col lg:flex-row bg-[#F4F0EC]">
      {/* Logo and Contact Section */}
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-primary pb-6 lg:pb-0 lg:pr-8">
        <div className="w-1/2 pb-4">
          <img src="/logo.png" alt="" className="max-w-[150px]" />
        </div>
        <div className="text-primary pb-4">
          <div className="border-t border-dashed border-primary"></div>
          <div className="flex py-2 gap-4">
            <i className="ri-phone-fill text-xl md:text-2xl flex justify-center items-center"></i>
            <div className="py-1 text-lg md:text-xl">1300 158 899</div>
          </div>
          <div className="border-t border-dashed border-primary"></div>
        </div>
        <div className="text-sm">
          <div className="font-semibold py-1">WHERE WE DELIVER</div>
          <div>Sydney Flower Delivery</div>
          <div>Melbourne Flower Delivery</div>
        </div>
      </div>

      {/* Popular Section */}
      <div className="w-full lg:w-auto px-0 lg:px-10 text-sm border-b lg:border-b-0 lg:border-r border-primary py-6 lg:py-0 lg:pr-10">
        <div className="font-semibold">POPULAR</div>
        <div className="grid grid-cols-2 pt-4 lg:pt-7 gap-x-10 lg:gap-x-20 gap-y-1">
          {footerPopular.map((item, index) => (
            <div key={index} className="hover:underline cursor-pointer">{item}</div>
          ))}
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="w-full lg:w-auto px-0 lg:px-10 text-sm pt-6 lg:pt-0">
        <div className="font-semibold">QUICK LINKS</div>
        <div className="grid grid-cols-2 pt-4 lg:pt-7 gap-x-10 lg:gap-x-20 gap-y-1">
          {footerLinks.map((item, index) => (
            <div key={index} className="hover:underline cursor-pointer">{item}</div>
          ))}
        </div>
        <div className="py-2 flex flex-col sm:flex-row mt-2 gap-4 sm:gap-0">
          {/* Social Media Icons */}
          <div className="text-3xl flex gap-2 justify-start sm:justify-center items-center sm:border-r border-primary sm:pr-4 py-1">
            <i className="ri-facebook-circle-fill"></i>
            <i className="ri-instagram-line"></i>
          </div>
          {/* Payment Methods */}
          <div className="flex gap-3 sm:gap-5 sm:pl-6 py-1 justify-start sm:justify-center items-center">
            <img alt="MasterCard" width="48" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/mastercard-2789e991b7ade46039eafc9c2dee83e7713eddb3_bwvc1z.svg" />
            <img alt="Visa" width="48" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/visa-60cf74cbad7400ab7427cd41529af15330af6383_spuac2.svg" />
            <img alt="Amex" width="48" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704112/amex-07ada099123d628aca142a88f03a41bf0af62076_br4ty5.svg" />
            <img alt="PayPal" width="48" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704095/paypal-2db521f81867a9e2879753ee1a4889d0ef6af0e8_vfncb8.svg" />
          </div>
        </div>
      </div>
    </div>

    {/* Copyright Section */}
    <div className="bg-[#DCC0B7] flex flex-col sm:flex-row px-4 md:px-20 lg:px-40 justify-between text-xs md:text-sm py-3 sm:py-1 gap-2 sm:gap-0">
      <div className="hover:underline cursor-pointer text-center sm:text-left">
        Copyright © 2025 Pearsons Florist. All rights reserved.
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-20 text-center sm:text-left">
        <div className="hover:underline cursor-pointer">Terms and Conditions</div>
        <div className="hover:underline cursor-pointer">Privacy Policy</div>
      </div>
    </div>
  </div>;
}
