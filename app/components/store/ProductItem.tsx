import { Link } from "@remix-run/react";
import formatCurrency from "~/utils/formatCurrency";
import { ProductListItem } from "~/types/product";

export default function ProductItem({ id, name, imgUrl, price }: ProductListItem) {
  return (
    <div className="cursor-pointer group">
      <Link to={`/product/${id}`}>
        <div className="overflow-hidden aspect-square rounded-md mb-2">
          <img
            src={imgUrl}
            alt={name}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="font-semibold pt-1 text-sm md:text-base text-gray-800 truncate group-hover:text-primary transition-colors">
          {name}
        </div>
        <div className="flex mt-1">
          {[...Array(5)].map((_, index) => (
            <i key={index} className="ri-star-fill text-[#FCBF02] text-xs sm:text-sm"></i>
          ))}
        </div>
        <div className="text-sm md:text-base font-medium text-primary mt-1">
          {formatCurrency(price)}
        </div>
      </Link>
    </div>
  );
}
