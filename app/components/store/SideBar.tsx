import { Link, useLocation } from "@remix-run/react";
import clsx from "clsx";
import { occasionToUrlMap } from "~/data/homepage";

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-full md:w-56 lg:w-60 md:pr-8 lg:pr-12 md:border-r md:border-border">
      <div className="eyebrow mb-5">Shop by occasion</div>
      <ul className="space-y-3">
        {Object.entries(occasionToUrlMap).map(([label, slug]) => {
          const isActive = location.pathname === `/categories/${slug}`;
          return (
            <li key={slug}>
              <Link
                to={`/categories/${slug}`}
                className={clsx(
                  "block text-[14px] transition-colors",
                  isActive
                    ? "text-terracotta font-medium"
                    : "text-charcoal hover:text-terracotta",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
