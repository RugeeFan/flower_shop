import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "~/types/product";

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setItems: (items: CartItem[]) => void;
  setCartOpen: (value: boolean) => void;

  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;

  totalItems: number;
  totalPrice: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setItems: (items) => set({ items }),

      setCartOpen: (value) => set({ isCartOpen: value }),

      addToCart: (product: Product) => {
        const exist = get().items.find((item) => item.id === product.id);
        if (exist) {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          }));
        } else {
          set((state) => ({
            items: [...state.items, { ...product, quantity: 1 }],
          }));
        }
      },

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ items: [] }),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })),

      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      get totalPrice() {
        return get().items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
