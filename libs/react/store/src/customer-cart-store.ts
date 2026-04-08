import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import BigNumber from 'bignumber.js';

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

export interface CustomerCartProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface CustomerCartItem {
  /** Unique UUID for this line item (same product with different options = different item). */
  id: string;
  product: CustomerCartProduct;
  quantity: number;
  selectedOptions: SelectedOption[];
  customText?: string;
  notes?: string;
}

export interface FulfillmentInfo {
  method: 'pickup' | 'delivery' | 'dine-in';
  locationId: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  deliveryAddressId?: string;
  tableIdentifier?: string;
}

export interface CustomerCartStore {
  items: CustomerCartItem[];
  fulfillment: FulfillmentInfo | null;
  tip: number;
  promoCode: string | null;
  notes: string | null;

  addItem: (
    product: CustomerCartProduct,
    options?: {
      selectedOptions?: SelectedOption[];
      customText?: string;
      notes?: string;
    },
  ) => void;
  updateItem: (id: string, updates: Partial<Pick<CustomerCartItem, 'quantity' | 'selectedOptions' | 'customText' | 'notes'>>) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clear: () => void;
  setFulfillment: (fulfillment: FulfillmentInfo | null) => void;
  setTip: (tip: number) => void;
  setPromoCode: (code: string | null) => void;
  setNotes: (notes: string | null) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useCustomerCartStore = create<CustomerCartStore>()(
  persist(
    (set) => ({
      items: [],
      fulfillment: null,
      tip: 0,
      promoCode: null,
      notes: null,

      addItem: (product, options) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              id: generateId(),
              product,
              quantity: 1,
              selectedOptions: options?.selectedOptions ?? [],
              customText: options?.customText,
              notes: options?.notes,
            },
          ],
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      incrementItem: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        })),

      decrementItem: (id) =>
        set((state) => {
          const target = state.items.find((item) => item.id === id);
          if (!target) return state;
          if (target.quantity <= 1) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
            ),
          };
        }),

      clear: () => set({ items: [], fulfillment: null, tip: 0, promoCode: null, notes: null }),

      setFulfillment: (fulfillment) => set({ fulfillment }),
      setTip: (tip) => set({ tip }),
      setPromoCode: (promoCode) => set({ promoCode }),
      setNotes: (notes) => set({ notes }),
    }),
    {
      name: 'customer-cart',
    },
  ),
);

// Computed selectors
export const selectCustomerSubtotal = (state: CustomerCartStore): number =>
  state.items
    .reduce((sum, item) => {
      const optionsPrice = item.selectedOptions.reduce(
        (opt, o) => opt.plus(o.priceAdjustment),
        new BigNumber(0),
      );
      return sum.plus(new BigNumber(item.product.price).plus(optionsPrice).times(item.quantity));
    }, new BigNumber(0))
    .toNumber();

export const selectCustomerTotalItems = (state: CustomerCartStore): number =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
