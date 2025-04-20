import formatCurrency from "~/utils/formatCurrency";
import Button from "~/components/ui/Button";
import { useCartStore } from "~/cart/useCartStore";
import { useNavigate } from "@remix-run/react";

interface CartPopupProps {
  onClose: () => void;
}

export default function CartPopup({ onClose }: CartPopupProps) {
  const navigate = useNavigate();

  const items = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    onClose();

    // ✅ 正确地只保存 cart（不要手动修改 cart-storage）
    localStorage.setItem("cart", JSON.stringify(items));

    setTimeout(() => {
      navigate("/checkout");
    }, 100);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:w-[480px] h-full flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <i className="ri-shopping-cart-line"></i>
            Shopping Cart
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <i className="ri-shopping-cart-line text-5xl mb-4"></i>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <div className="text-gray-500 text-sm mt-1">
                      Unit Price: {formatCurrency(item.price)}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          item.quantity > 1
                            ? useCartStore.setState((state) => ({
                                items: state.items.map((i) =>
                                  i.id === item.id
                                    ? { ...i, quantity: i.quantity - 1 }
                                    : i
                                ),
                              }))
                            : removeFromCart(item.id)
                        }
                      >
                        <i className="ri-subtract-line"></i>
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => addToCart(item)}
                      >
                        <i className="ri-add-line"></i>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <button
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Actions */}
        <div className="border-t p-4 md:p-6 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button fullWidth onClick={handleCheckout}>
            Proceed to Checkout
          </Button>

          <button
            onClick={onClose}
            className="w-full mt-2 text-center text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
