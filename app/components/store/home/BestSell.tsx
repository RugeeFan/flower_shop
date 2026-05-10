import { categoriesTag } from "~/data/homepage";
import { Link } from "@remix-run/react";
import ProductItem from "../ProductItem";
import type { Product } from "~/types/product";

export default function BestSell({ products }: { products: Product[] }) {
  return (
    <section className="bg-bone py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-14 gap-4">
          <div>
            <div className="eyebrow mb-2">This week</div>
            <h2 className="font-display text-charcoal text-[32px] md:text-[44px] leading-display tracking-tight">
              Best sellers
            </h2>
          </div>
          <Link
            to="/products"
            className="text-charcoal text-sm font-medium underline underline-offset-4 decoration-charcoal/30 hover:decoration-charcoal transition self-start md:self-end"
          >
            View all flowers →
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
          {products.map((product) => (
            <ProductItem key={product.id} {...product} />
          ))}
        </div>

        {/* Category quick links */}
        {categoriesTag?.length > 0 && (
          <>
            <div className="hairline my-16 md:my-20" />
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-10 md:gap-x-20">
              {categoriesTag.map((item) => (
                <Link
                  key={item.title}
                  to="/products"
                  className="group flex flex-col items-center text-charcoal hover:text-terracotta transition-colors"
                >
                  <i
                    className={`${item.icon} text-3xl md:text-4xl mb-3 transition-transform duration-slow group-hover:-translate-y-1`}
                  ></i>
                  <span className="text-[12px] uppercase tracking-eyebrow font-medium">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
