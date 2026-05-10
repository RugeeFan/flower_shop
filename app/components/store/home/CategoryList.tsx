import { categoriesTitle } from "~/data/homepage";
import { Link } from "@remix-run/react";

export default function CategoryList() {
  return (
    <section className="bg-cream/40 py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <div className="eyebrow mb-2">Shop by occasion</div>
          <h2 className="font-display text-charcoal text-[32px] md:text-[44px] leading-display tracking-tight">
            For every kind of moment.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categoriesTitle.map((item) => (
            <Link
              key={item.title}
              to="/products"
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
            >
              <div className="relative overflow-hidden bg-cream aspect-[4/5]">
                <img
                  src={item.imgUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-slow group-hover:scale-[1.04]"
                />
              </div>
              <div className="pt-4">
                <h3 className="font-display text-charcoal text-[18px] md:text-[20px] leading-tight">
                  {item.title}
                </h3>
                {item.content && (
                  <p className="text-[13px] text-ink-muted mt-1.5 leading-snug">
                    {item.content}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
