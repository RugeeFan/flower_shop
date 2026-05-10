import React from "react";
import { introTag } from "~/data/homepage";

export default function Intro() {
  return <div className="bg-[#2E2E2E] text-white py-6 md:py-10">
    <div className="flex flex-col justify-center items-center px-4 md:px-0">
      <div className="font-semibold text-2xl md:text-3xl py-6 md:py-10 text-center">
        About Us
      </div>

      {/* 主要介绍文字 */}
      <div className="w-full md:w-3/4 lg:w-1/2 text-center py-4 text-sm md:text-base">
        Sharing Love and Beauty, One Bouquet at a Time — Sydney’s Local Florist
        At Royalrose Florist, flowers are more than just gifts—they’re little moments of joy, love, and connection. For over ten years, we’ve been helping people across Sydney express their feelings through thoughtfully arranged, fresh flowers.

        Every bouquet is made with care by our experienced team, using seasonal blooms chosen for their colour, fragrance, and charm. Whether it’s a birthday, a “just because,” or a moment that needs comfort, we’re here to help you make it special. And if your flowers aren’t quite right, let us know within 48 hours—we’ll happily fix it.


      </div>

      {/* 致谢文字 */}
      <div className="w-full md:w-3/4 lg:w-1/2 text-center text-sm md:text-base px-4">
        Royalrose Florist respectfully acknowledge the Traditional Owners of the land we work on and honour their deep connection to Country, culture, and community.
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
