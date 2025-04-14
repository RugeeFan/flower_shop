import { categoriesTitle } from "~/data/homepage";
import { Link } from "@remix-run/react";

export default function CategoryList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 justify-center items-center px-4 md:px-20 lg:px-40 py-6 md:py-10">
      {categoriesTitle.map((item) => {
        return (
          <Link
            key={item.title}
            to="/categories"
            className="group relative w-full h-0 pb-[75%] sm:pb-[56.25%] rounded-lg overflow-hidden"
          >
            {/* Image inside the div */}
            <img
              src={item.imgUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {/* Adding the overlay for the image */}
            <div className="absolute inset-0 bg-black opacity-40 rounded-lg"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 p-2 md:p-4">
              <div className="text-base md:text-lg font-bold text-center">
                {item.title}
              </div>
              <div className="text-xs md:text-sm text-center mt-1">
                {item.content}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
