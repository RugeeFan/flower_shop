import { Link } from "@remix-run/react";

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
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function DropdownMenu({ 
  title, 
  items, 
  isOpen, 
  onToggle, 
  isMobile = false,
  onClose = () => {}
}: DropdownMenuProps) {
  // 获取URL路径，如果没有映射则使用小写并替换空格为连字符
  const getUrlPath = (item: string) => {
    return occasionToUrlMap[item] || item.toLowerCase().replace(/\s+/g, '-');
  };

  // 处理链接点击，关闭下拉菜单
  const handleLinkClick = () => {
    if (isOpen) {
      onClose();
    }
  };

  // 只在桌面版使用这个组件的下拉功能
  // 移动版的下拉功能由 NavBar 组件处理
  if (isMobile) {
    return (
      <div
        className="flex items-center gap-1 cursor-pointer text-primary hover:text-primary/80 transition-colors"
        onClick={onToggle}
      >
        <span>{title}</span>
        <i className={`ri-arrow-down-s-line transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>
    );
  }

  // 桌面版下拉菜单
  return (
    <div className="relative group">
      <div
        className="flex items-center gap-1 cursor-pointer text-primary hover:text-primary/80 transition-colors"
        onClick={onToggle}
      >
        <span>{title}</span>
        <i className={`ri-arrow-down-s-line transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
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