import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  onClose: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 组件挂载时自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();

    // 添加 ESC 键关闭搜索栏
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 实现搜索逻辑
    console.log('Searching for:', searchTerm);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center">
      <div className="w-full min-h-[120px] bg-white shadow-lg">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Search Products</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for flowers, gifts..."
              className="w-full px-4 py-3 pr-12 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              <i className="ri-search-line text-xl"></i>
            </button>
          </form>

          {searchTerm && (
            <div className="mt-4 text-sm text-gray-500">
              Press Enter to search for "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
