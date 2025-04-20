import { Link } from "@remix-run/react";
import { useDropdownStore } from "~/lib/useDropdownStore";

// 创建显示文本到URL路径的映射
const occasionToUrlMap: Record<string, string> = {
  "Anniversary": "anniversary",
  "Sympathy Flowers For The Home": "sympathy-flowers-for-the-home",
  "Get Well": "get-well",
  "Celebration": "celebration",
  "Corporate": "corporate",
  "Valentines Day": "valentines-day",
  "Christmas": "christmas",
  "Same Day Delivery": "same-day-delivery",
  "Multi Coloured Flower Arrangements": "multi-coloured-flower-arrangements",
  "Birthday": "birthday",
  "New Baby": "new-baby",
  "I'm Sorry": "im-sorry",
  "Thank You": "thank-you",
  "Congratulations": "congratulations",
  "Mothers Day": "mothers-day",
  "Romance": "romance",
  "Green Flowers": "green-flowers",
  "Funeral Flowers": "funeral-flowers",
  "Bestsellers": "bestsellers"
};

interface DropdownMenuProps {
  title: string;
  items: string[];
  isMobile?: boolean;
}

export default function DropdownMenu({
  title,
  items,
  isMobile = false,
}: DropdownMenuProps) {
  const isOpen = useDropdownStore((state) => state.isOpen);
  const toggle = useDropdownStore((state) => state.toggle);
  const close = useDropdownStore((state) => state.close);

  const getUrlPath = (item: string) => {
    return occasionToUrlMap[item] || item.toLowerCase().replace(/\s+/g, "-");
  };

  const handleLinkClick = () => {
    close();
  };

  if (isMobile) {
    return (
      <div
        className="flex items-center gap-1 cursor-pointer text-primary hover:text-primary/80 transition-colors"
        onClick={toggle}
      >
        <span>{title}</span>
        <i className={`ri-arrow-down-s-line transition-transform ${isOpen ? "rotate-180" : ""}`}></i>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        className="flex items-center gap-1 cursor-pointer text-primary hover:text-primary/80 transition-colors"
        onClick={toggle}
      >
        <span>{title}</span>
        <i className={`ri-arrow-down-s-line transition-transform ${isOpen ? "rotate-180" : ""}`}></i>
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
