import { Link } from "@remix-run/react";
import { useDropdownStore } from "~/zustand/useDropdownStore";
import { occasionToUrlMap } from "~/data/homepage";

interface DropdownMenuProps {
  title: string;
  items: string[];
  dropdownKey: "occasion" | "wedding";
  isMobile?: boolean;
}

import { useEffect, useRef } from "react";

export default function DropdownMenu({
  title,
  items,
  dropdownKey,
  isMobile = false,
}: DropdownMenuProps) {
  const openDropdown = useDropdownStore((state) => state.openDropdown);
  const toggle = useDropdownStore((state) => state.toggle);
  const close = useDropdownStore((state) => state.close);
  const isOpen = openDropdown === dropdownKey;
  const containerRef = useRef<HTMLDivElement>(null);

  const getUrlPath = (item: string) =>
    occasionToUrlMap[item] || item.toLowerCase().replace(/\s+/g, "-");

  const handleLinkClick = () => close();
  const toggleThis = () => toggle(dropdownKey);

  // ✅ 监听点击页面其他区域关闭 dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, close]);

  if (isMobile) {
    return (
      <div ref={containerRef}>
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer text-primary hover:text-primary/80 transition-colors"
          onClick={toggleThis}
        >
          <span>{title}</span>
          <i className={`ri-arrow-down-s-line transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>

        {isOpen && (
          <div className="flex flex-col gap-1 px-6 pb-3">
            {items.map((item) => (
              <Link
                key={item}
                to={`/categories/${getUrlPath(item)}`}
                className="text-sm text-primary hover:text-primary/80 py-1 transition-colors"
                onClick={handleLinkClick}
              >
                {item}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="relative group dropdown-container" ref={containerRef}>
      <div
        className="flex items-center gap-1 cursor-pointer text-primary hover:text-primary/80 transition-colors"
        onClick={toggleThis}
      >
        <span>{title}</span>
        <i className={`ri-arrow-down-s-line transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-56 left-1/2 transform -translate-x-1/2 mt-2 bg-white shadow-lg rounded-sm">
          <div className="p-3 flex flex-col gap-y-1">
            {items.map((item) => (
              <Link
                key={item}
                to={`/categories/${getUrlPath(item)}`}
                className="text-sm text-primary hover:text-primary/80 py-1.5 transition-colors"
                onClick={handleLinkClick}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

