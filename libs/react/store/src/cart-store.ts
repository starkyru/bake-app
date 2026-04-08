import { create } from 'zustand';
import BigNumber from 'bignumber.js';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

const TAX_RATE = 0.12;

export interface CartStore {
  items: CartItem[];
  addItem: (product: CartProduct) => void;
  removeItem: (index: number) => void;
  incrementItem: (index: number) => void;
  decrementItem: (index: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],

  addItem: (product) =>
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingIndex >= 0) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { items: updated };
      }

      return { items: [...state.items, { product, quantity: 1 }] };
    }),

  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),

  incrementItem: (index) =>
    set((state) => {
      const updated = [...state.items];
      updated[index] = {
        ...updated[index],
        quantity: updated[index].quantity + 1,
      };
      return { items: updated };
    }),

  decrementItem: (index) =>
    set((state) => {
      const item = state.items[index];
      if (!item) return state;

      if (item.quantity <= 1) {
        return { items: state.items.filter((_, i) => i !== index) };
      }

      const updated = [...state.items];
      updated[index] = {
        ...updated[index],
        quantity: updated[index].quantity - 1,
      };
      return { items: updated };
    }),

  clear: () => set({ items: [] }),
}));

// Computed selectors
export const selectSubtotal = (state: CartStore): number =>
  state.items
    .reduce((sum, item) => sum.plus(new BigNumber(item.product.price).times(item.quantity)), new BigNumber(0))
    .toNumber();

export const selectTax = (state: CartStore): number =>
  new BigNumber(selectSubtotal(state)).times(TAX_RATE).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber();

export const selectTotal = (state: CartStore): number =>
  new BigNumber(selectSubtotal(state)).plus(selectTax(state)).toNumber();

export const selectTotalItems = (state: CartStore): number =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
