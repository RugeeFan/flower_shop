// utils/cartUtils.ts
export function getCartFromLocalStorage() {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("cart");
  return data ? JSON.parse(data) : [];
}
