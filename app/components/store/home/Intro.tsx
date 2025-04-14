import React from "react";
import { introTag } from "~/data/homepage";

export default function Intro() {
  return <div className="bg-[#2E2E2E] text-white py-6 md:py-10">
    <div className="flex flex-col justify-center items-center px-4 md:px-0">
      <div className="font-semibold text-2xl md:text-3xl py-6 md:py-10 text-center">
        FAMILY OWNED SINCE 1969
      </div>

      {/* 主要介绍文字 */}
      <div className="w-full md:w-3/4 lg:w-1/2 text-center py-4 text-sm md:text-base">
        For over 50 years, Pearsons Florist have been providing high quality, fresh flower arrangements and Flower Delivery in Sydney. Every flower bouquet delivered is created by one of our qualified, experienced and dedicated Sydney and Melbourne florists. With over 50 years experience in floristry you can ensure the team at Pearsons Florists are flower experts. If for any reason you are not 100% satisfied with your gift, contact us within 48 hours, email a photo or return your gift to us and we will create a replacement for you. That's our guarantee as Sydney and Melbourne's best florists!
      </div>

      {/* 致谢文字 */}
      <div className="w-full md:w-3/4 lg:w-1/2 text-center text-sm md:text-base px-4">
        Pearsons Florist acknowledges the Traditional Owners of this country and recognise their continuing connection to land, waters and culture. We pay our respect to Aboriginal and Torres Strait Islander peoples, and their Elders – past, present and emerging.
      </div>

      {/* 特色标签部分 */}
      <div className="space-y-4 mt-10 md:mt-20 px-4 md:px-20 lg:px-40 w-full">
        {/* 第一条虚线 */}
        <div className="border-t border-dashed border-white"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 py-6 md:py-10">
          {introTag.map(item => {
            return <div key={item.title} className="flex items-start">
              <div className="text-3xl md:text-5xl flex justify-center items-center px-4 font-mono">
                <i className={item.icon}></i>
              </div>
              <div>
                <div className="text-base md:text-lg font-medium">{item.title}</div>
                <div className="text-sm md:text-base text-gray-300">{item.content}</div>
              </div>
            </div>
          })}
        </div>

        <div className="border-t border-dashed border-white"></div>
      </div>

      <button className="pt-6 md:pt-10 underline text-sm md:text-base hover:text-gray-300 transition-colors">
        Read More
      </button>
    </div>
  </div>;
}
