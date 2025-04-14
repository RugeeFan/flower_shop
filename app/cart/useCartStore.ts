// app/store/cartStore.ts
import { create } from "zustand";
import { Product } from "~/types/product";

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (value: boolean) => void;

  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantity: number) => void;

  totalItems: number;
  totalPrice: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isCartOpen: false,
  setCartOpen: (value) => set({ isCartOpen: value }),

  addToCart: (product: Product) => {
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return {
        items: [...state.items, { ...product, quantity: 1 }],
      };
    });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      // 移除该商品
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } else {
      // 正常更新数量
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        ),
      }));
    }
  },

  removeFromCart: (id: number) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  clearCart: () => set({ items: [] }),

  get totalItems() {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },
  get totalPrice() {
    return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  },
}));
