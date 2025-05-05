// ~/zustand/useDropdownStore.ts
import { create } from "zustand";

type DropdownKey = "occasion" | "wedding" | null;

interface DropdownState {
  openDropdown: DropdownKey;
  toggle: (key: DropdownKey) => void;
  close: () => void;
}

export const useDropdownStore = create<DropdownState>((set) => ({
  openDropdown: null,
  toggle: (key) =>
    set((state) => ({
      openDropdown: state.openDropdown === key ? null : key,
    })),
  close: () => set({ openDropdown: null }),
}));
