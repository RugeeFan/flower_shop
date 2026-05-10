import { useEffect, useState } from "react";
import { useCartStore } from "~/zustand/useCartStore";
import formatCurrency from "~/utils/formatCurrency";

interface Product {
  id: string;
  name: string;
  price: number;
  imgUrl: string;
}

export default function AddMoreItem() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const addToCart = useCartStore((state) => state.addToCart);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch("/api/products/add-on");
      const data = await res.json();
      setProducts(data);
    }
    fetchProducts();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedProductId(id === selectedProductId ? null : id);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imgUrl: product.imgUrl,
    });
    setSelectedProductId(null);
    setCartOpen(true);
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {products.map((item) => {
        const selected = item.id === selectedProductId;
        return (
          <div
            key={item.id}
            className={`relative rounded-lg overflow-hidden border cursor-pointer transition duration-300 ${selected ? "border-primary shadow-md" : "border-gray-300"
              }`}
            onClick={() => handleSelect(item.id)}
          >
            <img src={item.imgUrl || ""} alt={item.name} className="w-full object-cover" />
            <div className="text-[0.65rem] text-center py-1">{item.name}</div>
            <div className="text-[0.65rem] text-center pb-2">
              {formatCurrency(item.price)}
            </div>

            {selected && (
              <div className="absolute inset-0 bg-white bg-opacity-40  flex items-center justify-center transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item);
                  }}
                  className="bg-primary text-white px-4 py-2 rounded font-bold shadow hover:bg-primary transition"
                >
                  Add to Cart
                </button>
              </div>

            )}
          </div>
        );
      })}

      <div className="flex flex-col items-center justify-center cursor-pointer">
        <i className="ri-add-circle-line text-4xl text-gray-600 hover:text-black" />
        <div className="underline text-sm font-semibold mt-1">VIEW MORE</div>
      </div>
    </div>
  );
}
