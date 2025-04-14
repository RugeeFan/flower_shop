import { Outlet } from "@remix-run/react";
import ProductItem from "~/components/store/ProductItem";
import ProductItemBig from "~/components/store/ProductItemBig";
import { bestSellTitle, whyChooseUs } from "~/data/homepage";

export default function Categories() {
  return <div className="px-4 md:px-20 lg:px-40">
    <Outlet />
    {/* <div className="py-10 md:py-20 font-bold tracking-widest text-2xl md:text-4xl text-center md:text-left">BEST SELLERS</div> */}
    {/* <div className="pb-10">

      <div className="flex flex-col lg:flex-row lg:gap-20 py-5 lg:py-10">
        <div className="w-full lg:w-1/2 mb-4 lg:mb-0">
          <ProductItemBig />
        </div>
        <div className="w-full lg:w-1/2 grid grid-cols-2 gap-2">
          {bestSellTitle.slice(0, 4).map((item, index) => (
            <div key={index}>
              <ProductItem product={item} />
            </div>
          ))}
        </div>
      </div>


      <div className="hidden lg:flex flex-col lg:flex-row lg:gap-20 py-5 lg:py-10">

        <div className="w-full lg:w-1/2 grid grid-cols-2 gap-2">
          {bestSellTitle.slice(0, 4).map((item, index) => (
            <div key={index}>
              <ProductItem product={item} />
            </div>
          ))}
        </div>
        <div className="w-full lg:w-1/2 mb-4 lg:mb-0">
          <ProductItemBig />
        </div>
      </div>

      <div className="hidden lg:flex flex-col lg:flex-row lg:gap-20 py-5 lg:py-10">
        <div className="w-full lg:w-1/2 mb-4 lg:mb-0">
          <ProductItemBig />
        </div>
        <div className="w-full lg:w-1/2 grid grid-cols-2 gap-2">
          {bestSellTitle.slice(0, 4).map((item, index) => (
            <div key={index}>
              <ProductItem product={item} />
            </div>
          ))}
        </div>
      </div>
    </div> */}
    {/* <div>
      <hr />
      <div className="pt-10">
        {whyChooseUs.map((item, index) => {
          return <div key={index} className="pb-10">
            <div className="font-bold text-xl md:text-2xl">{item.title}</div>
            <div className="text-sm md:text-base">{item.content}</div>
          </div>
        })}
      </div>
    </div> */}
  </div>;
}
