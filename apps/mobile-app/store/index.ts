import { create } from 'zustand';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  orders: Order[];
  products: Product[];
  inventory: InventoryItem[];
  cart: CartItem[];

  setUser: (user: UserInfo | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setOrders: (orders: Order[]) => void;
  setProducts: (products: Product[]) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  orders: [],
  products: [],
  inventory: [],
  cart: [],

  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setOrders: (orders) => set({ orders }),
  setProducts: (products) => set({ products }),
  setInventory: (inventory) => set({ inventory }),

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity: 1 }] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),

  updateCartQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((item) => item.product.id !== productId) };
      }
      return {
        cart: state.cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      };
    }),

  clearCart: () => set({ cart: [] }),

  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      orders: [],
      products: [],
      inventory: [],
      cart: [],
    }),
}));
