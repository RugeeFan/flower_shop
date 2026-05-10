import { Link } from "@remix-run/react";
import formatCurrency from "~/utils/formatCurrency";
import { ProductListItem } from "~/types/product";

export default function ProductItem({ id, name, imgUrl, price }: ProductListItem) {
  return (
    <Link
      to={`/product/${id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
    >
      <div className="overflow-hidden bg-cream aspect-[4/5]">
        <img
          src={imgUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="pt-4">
        <h3 className="font-display text-[17px] md:text-[18px] text-charcoal leading-tight tracking-tight truncate">
          {name}
        </h3>
        <div className="mt-1.5 text-[13px] text-ink-muted">
          {formatCurrency(price)}
        </div>
      </div>
    </Link>
  );
}
