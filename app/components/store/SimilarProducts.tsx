import { bestSellTitle } from "~/data/homepage";
import ProductItem from "./ProductItem";

export default function SimilarProducts() {
  return (
    <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40">
      <hr />
      <div className="font-bold text-xl py-4">SIMILAR PRODUCTS</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-center items-center gap-2 sm:gap-4">
        {bestSellTitle.map((item, index) => (
          <ProductItem key={index} product={item} />
        ))}
      </div>
      <div className="pt-6 md:pt-10">
        <hr />
      </div>
    </div>
  );
}