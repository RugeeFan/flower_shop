import { bestSellTitle } from "~/data/homepage";
import ProductItem from "./ProductItem";

export default function SimilarProducts() {
  return (
    <section className="bg-bone">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
        <div className="hairline mb-12" />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-10">
          <div>
            <div className="eyebrow mb-2">You may also like</div>
            <h2 className="font-display text-charcoal text-[28px] md:text-[36px] leading-display">
              Similar arrangements
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {bestSellTitle.map((item, index) => (
            <ProductItem
              key={index}
              id={String(index)}
              name={item.title}
              imgUrl={item.imgUrl}
              price={item.price}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
