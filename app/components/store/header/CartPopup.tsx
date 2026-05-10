import formatCurrency from "~/utils/formatCurrency";
import Button from "~/components/ui/Button";
import { useCartStore } from "~/zustand/useCartStore";
import { useNavigate } from "@remix-run/react";

interface CartPopupProps {
  onClose: () => void;
}

export default function CartPopup({ onClose }: CartPopupProps) {
  const navigate = useNavigate();

  const items = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    setTimeout(() => navigate("/checkout"), 100);
  };

  const handleDecrement = (id: string, currentQty: number) => {
    if (currentQty > 1) {
      updateQuantity(id, currentQty - 1);
    } else {
      removeFromCart(id);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-charcoal/40 z-50 flex justify-end"
      onClick={onClose}
    >
      <aside
        className="bg-bone w-full md:w-[460px] h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
        aria-label="Shopping bag"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h2 className="font-display text-charcoal text-[22px] leading-none">
            Your bag
          </h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-charcoal transition-colors"
            aria-label="Close"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="eyebrow mb-3">Empty bag</div>
              <p className="font-display text-charcoal text-[26px] leading-display max-w-[26ch]">
                A blank canvas, waiting for the right bouquet.
              </p>
              <button
                onClick={onClose}
                className="mt-8 text-charcoal text-sm underline underline-offset-4 decoration-charcoal/30 hover:decoration-charcoal transition"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-5 py-5 first:pt-0 last:pb-0">
                  <div className="w-20 h-24 flex-shrink-0 bg-cream overflow-hidden">
                    <img
                      src={Array.isArray(item.imgUrl) ? item.imgUrl[0] : item.imgUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="font-display text-charcoal text-[16px] leading-tight">
                      {item.name}
                    </h3>
                    <div className="text-[12px] text-ink-muted mt-1">
                      {formatCurrency(item.price)} each
                    </div>

                    <div className="mt-auto pt-4 flex items-center gap-3">
                      <div className="inline-flex items-center border border-border">
                        <button
                          onClick={() => handleDecrement(item.id, item.quantity)}
                          className="w-8 h-8 flex items-center justify-center text-charcoal hover:bg-cream transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <i className="ri-subtract-line text-sm"></i>
                        </button>
                        <span className="w-8 text-center text-[13px] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 flex items-center justify-center text-charcoal hover:bg-cream transition-colors"
                          aria-label="Increase quantity"
                        >
                          <i className="ri-add-line text-sm"></i>
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[12px] text-ink-muted hover:text-terracotta underline underline-offset-2 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-charcoal text-[14px] tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5 bg-cream/40">
            <div className="space-y-2 mb-5 text-[14px]">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border text-charcoal">
                <span className="font-display text-[18px]">Total</span>
                <span className="font-display text-[18px] tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            <Button fullWidth onClick={handleCheckout}>
              Proceed to checkout
            </Button>
            <button
              onClick={onClose}
              className="w-full mt-3 text-center text-ink-muted hover:text-charcoal transition-colors text-[12px] tracking-eyebrow uppercase"
            >
              Continue browsing
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
