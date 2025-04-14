import { Link } from "@remix-run/react";
import React from "react";
import formatCurrency from "~/utils/formatCurrency";

export default function ProductItemBig() {
  return (
    <div className="cursor-pointer flex flex-col justify-between h-full">
      <Link to="/product" className="h-full flex flex-col">
        <div className="overflow-hidden flex-grow">
          <img
            src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742726175/Hyacinth_Vase_4_vhuqh4.webp"
            alt="Hyacinth Vase"
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-110"
          />
        </div>
        <div className="mt-2">
          <div className="font-semibold text-xs sm:text-sm">Hyacinth Vase</div>
          <div className="flex">
            {[...Array(5)].map((_, index) => (
              <i key={index} className="ri-star-fill text-[#FCBF02] text-xs sm:text-sm"></i>
            ))}
          </div>
          <div className="text-xs sm:text-sm">{formatCurrency(135)}</div>
        </div>
      </Link>
    </div>
  );
}