import { Link, useLocation } from "@remix-run/react";
import clsx from "clsx";
import { occasionToUrlMap } from "~/data/homepage";

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-full md:w-64 p-4 border-r border-gray-200 bg-white">
      <h2 className="text-lg font-semibold text-primary uppercase mb-4 ">
        Shop by Occasion
      </h2>
      <ul className="space-y-2">
        {Object.entries(occasionToUrlMap).map(([label, slug]) => (
          <li key={slug}>
            <Link
              to={`/categories/${slug}`}
              className={clsx(
                "block hover:text-primary transition",
                location.pathname === `/categories/${slug}`
                  ? "text-primary font-semibold"
                  : "text-gray-700"
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
