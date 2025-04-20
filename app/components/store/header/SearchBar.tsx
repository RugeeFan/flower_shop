import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@remix-run/react";

interface ProductResult {
  id: string;
  name: string;
  imgUrl: string;
}

interface SearchBarProps {
  onClose: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        fetch(`/api/search-products?q=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .then(data => setResults(data))
          .catch(() => setResults([]));
      } else {
        setResults([]);
      }
    }, 300); // debounce

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSelect = (id: string) => {
    onClose();
    navigate(`/product/${id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center">
      <div className="w-full min-h-[120px] bg-white shadow-lg">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Search Products</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for flowers, gifts..."
            className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-lg"
          />

          {results.length > 0 && (
            <ul className="mt-4 border-t pt-4 divide-y">
              {results.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-4 py-2 cursor-pointer hover:bg-gray-100 px-2 rounded"
                  onClick={() => handleSelect(product.id)}
                >
                  <img
                    src={Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl}
                    className="w-12 h-12 object-cover rounded"
                    alt={product.name}
                  />
                  <span className="text-gray-800">{product.name}</span>
                </li>
              ))}
            </ul>
          )}

          {searchTerm && results.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
