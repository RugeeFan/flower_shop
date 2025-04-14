import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imgUrl: string[];
}

export default function OrderSummary() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      } catch (e) {
        console.error("Invalid cart in localStorage");
      }
    }
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-gray-100 p-6 rounded-md border">
      <h2 className="text-xl font-bold mb-4">ORDER SUMMARY</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b pb-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={item.imgUrl[0]}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <Link
                  to={`/products/${item.id}`}
                  className="text-sm font-medium underline"
                >
                  {item.name}
                </Link>
                <div className="mt-2 text-sm text-gray-500">
                  Quantity: {item.quantity}
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Excluding delivery</p>
      </div>
    </div>
  );
}
