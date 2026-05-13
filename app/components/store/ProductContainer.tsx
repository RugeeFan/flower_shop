import Carousel from "./Carousel";
import AddMoreItem from "./AddMoreItem";
import { Product } from "~/types/product";
import formatCurrency from "~/utils/formatCurrency";
import { useCartStore } from "~/zustand/useCartStore";

export default function ProductContainer({ product }: { product: Product }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const images = Array.isArray(product.imgUrl) ? product.imgUrl : [product.imgUrl];
  const categoryName = product.categories?.[0]?.name;

  return (
    <section className="bg-bone">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
          {/* Image (left, sticky on desktop) */}
          <div className="md:col-span-7 lg:col-span-7">
            <div className="md:sticky md:top-12">
              <div className="bg-cream overflow-hidden aspect-[4/5]">
                <Carousel images={images} />
              </div>
            </div>
          </div>

          {/* Details (right) */}
          <div className="md:col-span-5 lg:col-span-5">
            {categoryName && (
              <div className="eyebrow mb-3">{categoryName}</div>
            )}
            <h1 className="font-display text-charcoal text-[32px] md:text-[40px] leading-display tracking-tight">
              {product.name}
            </h1>

            <div className="mt-3 text-[13px] text-ink-muted">
              <span className="text-charcoal tabular-nums">{formatCurrency(product.price)}</span>
              <span className="mx-2">·</span>
              <span>Crafted in our Sydney studio</span>
            </div>

            {/* Description */}
            <div className="mt-8 text-charcoal text-[15px] md:text-[16px] leading-body space-y-4">
              <p>{product.description}</p>
              <p className="text-ink-muted">
                Flowers and shades may vary with seasonal availability — your
                arrangement will always include a thoughtfully chosen selection
                of fresh blooms in keeping with the design.
              </p>
            </div>

            {/* Add-ons */}
            <div className="mt-10">
              <div className="eyebrow mb-4">Add a little extra</div>
              <AddMoreItem />
            </div>

            {/* Delivery note */}
            <div className="mt-8 border-t border-b border-border py-4 text-[13px] text-ink-muted flex items-center gap-3">
              <i className="ri-truck-line text-base text-terracotta"></i>
              <span>
                Order by 2 PM for same-day delivery across Sydney. Mon — Sat.
              </span>
            </div>

            {/* Add to cart */}
            <div className="mt-8 flex items-stretch gap-3">
              <div className="flex-1 flex flex-col justify-center px-1">
                <div className="eyebrow">Price</div>
                <div className="font-display text-charcoal text-[28px] tabular-nums leading-none mt-1">
                  {formatCurrency(product.price)}
                </div>
              </div>
              <button
                onClick={() => {
                  addToCart(product);
                  setCartOpen(true);
                }}
                className="bg-charcoal text-bone hover:bg-terracotta transition-colors px-8 py-4 text-[12px] font-medium uppercase tracking-eyebrow"
              >
                Add to bag
              </button>
            </div>

            {/* Trust row */}
            <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-ink-muted text-[12px]">
              <div className="eyebrow">Guaranteed safe checkout</div>
              <div className="flex flex-wrap gap-3 items-center opacity-80">
                <img alt="Visa" className="h-6" src="/brand/visa.svg" />
                <img alt="MasterCard" className="h-6" src="/brand/mastercard.svg" />
                <img alt="Amex" className="h-6" src="/brand/amex.svg" />
                <img alt="PayPal" className="h-6" src="/brand/paypal.svg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
