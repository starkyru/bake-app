import { create } from 'zustand';

export interface OrderingUIStore {
  selectedLocationId: string | null;
  cartDrawerOpen: boolean;
  activeDietaryFilters: string[];
  menuSearchQuery: string;
  setSelectedLocationId: (id: string | null) => void;
  toggleCartDrawer: () => void;
  setCartDrawerOpen: (open: boolean) => void;
  setDietaryFilters: (filters: string[]) => void;
  setMenuSearchQuery: (query: string) => void;
}

export const useOrderingUIStore = create<OrderingUIStore>((set) => ({
  selectedLocationId: null,
  cartDrawerOpen: false,
  activeDietaryFilters: [],
  menuSearchQuery: '',

  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  toggleCartDrawer: () => set((state) => ({ cartDrawerOpen: !state.cartDrawerOpen })),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  setDietaryFilters: (filters) => set({ activeDietaryFilters: filters }),
  setMenuSearchQuery: (query) => set({ menuSearchQuery: query }),
}));
