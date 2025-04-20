import { categoriesTag } from "~/data/homepage";
import { Link } from "@remix-run/react";
import ProductItem from "../ProductItem";
import type { Product } from "~/types/product";

export default function BestSell({ products }: { products: Product[] }) {
  return (
    <div className="bg-[#F4F7F7]">
      <div className="px-4 md:px-0">
        <div className="flex justify-center items-center font-bold text-xl md:text-3xl pt-6 md:pt-10 text-center">
          THIS WEEK'S BEST SELLERS
        </div>
        <div className="text-xs md:text-sm flex justify-center items-center pt-2 pb-6 md:pb-10 text-center px-4">
          Same day flower delivery across Sydney and Melbourne
        </div>
      </div>

      {/* 产品展示 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-4 md:px-20 lg:px-40">
        {products.map((product) => (
          <ProductItem key={product.id} {...product} />
        ))}
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 md:gap-28 pt-8 text-primary px-4 md:px-0">
        {categoriesTag.map(item => {
          return (
            <Link
              to="/products"
              key={item.title}
              className="pb-4 w-[calc(33%-1rem)] md:w-auto hover:opacity-80 transition-opacity"
            >
              <div className="flex justify-center items-center py-2 md:py-4 cursor-pointer">
                <i className={`${item.icon} text-4xl md:text-6xl`}></i>
              </div>
              <div className="font-semibold text-center text-sm md:text-base">
                {item.title}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
