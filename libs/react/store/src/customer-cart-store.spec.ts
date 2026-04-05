import {
  useCustomerCartStore,
  selectCustomerSubtotal,
  selectCustomerTotalItems,
  CustomerCartStore,
  CustomerCartProduct,
} from './customer-cart-store';

// Mock crypto.randomUUID for deterministic IDs in tests
let uuidCounter = 0;
const originalRandomUUID = globalThis.crypto?.randomUUID;
beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => `test-uuid-${++uuidCounter}`,
    },
    configurable: true,
  });
});
afterAll(() => {
  if (originalRandomUUID) {
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...globalThis.crypto, randomUUID: originalRandomUUID },
      configurable: true,
    });
  }
});

const mockProduct: CustomerCartProduct = {
  id: 'prod-1',
  name: 'Croissant',
  price: 50,
  category: 'Pastries',
};

const mockProduct2: CustomerCartProduct = {
  id: 'prod-2',
  name: 'Latte',
  price: 80,
  category: 'Drinks',
};

describe('useCustomerCartStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useCustomerCartStore.setState({
      items: [],
      fulfillment: null,
      tip: 0,
      promoCode: null,
      notes: null,
    });
    uuidCounter = 0;
  });

  describe('addItem', () => {
    it('should add item to cart with unique id', () => {
      useCustomerCartStore.getState().addItem(mockProduct);

      const state = useCustomerCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].product.id).toBe('prod-1');
      expect(state.items[0].quantity).toBe(1);
      expect(state.items[0].id).toBe('test-uuid-1');
    });

    it('should create separate items for same product with different options', () => {
      const opts1 = {
        selectedOptions: [
          { groupId: 'g1', groupName: 'Size', optionId: 'o1', optionName: 'Small', priceAdjustment: 0 },
        ],
      };
      const opts2 = {
        selectedOptions: [
          { groupId: 'g1', groupName: 'Size', optionId: 'o2', optionName: 'Large', priceAdjustment: 20 },
        ],
      };

      useCustomerCartStore.getState().addItem(mockProduct, opts1);
      useCustomerCartStore.getState().addItem(mockProduct, opts2);

      const state = useCustomerCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].id).not.toBe(state.items[1].id);
      expect(state.items[0].selectedOptions[0].optionName).toBe('Small');
      expect(state.items[1].selectedOptions[0].optionName).toBe('Large');
    });

    it('should add item with custom text and notes', () => {
      useCustomerCartStore.getState().addItem(mockProduct, {
        customText: 'Happy Birthday!',
        notes: 'Extra chocolate',
      });

      const item = useCustomerCartStore.getState().items[0];
      expect(item.customText).toBe('Happy Birthday!');
      expect(item.notes).toBe('Extra chocolate');
    });
  });

  describe('incrementItem', () => {
    it('should increase quantity by 1', () => {
      useCustomerCartStore.getState().addItem(mockProduct);
      const id = useCustomerCartStore.getState().items[0].id;

      useCustomerCartStore.getState().incrementItem(id);

      expect(useCustomerCartStore.getState().items[0].quantity).toBe(2);
    });
  });

  describe('decrementItem', () => {
    it('should decrease quantity by 1', () => {
      useCustomerCartStore.getState().addItem(mockProduct);
      const id = useCustomerCartStore.getState().items[0].id;
      useCustomerCartStore.getState().incrementItem(id); // quantity = 2

      useCustomerCartStore.getState().decrementItem(id);

      expect(useCustomerCartStore.getState().items[0].quantity).toBe(1);
    });

    it('should remove item when quantity reaches 0', () => {
      useCustomerCartStore.getState().addItem(mockProduct);
      const id = useCustomerCartStore.getState().items[0].id;

      useCustomerCartStore.getState().decrementItem(id);

      expect(useCustomerCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('removeItem', () => {
    it('should remove specific item', () => {
      useCustomerCartStore.getState().addItem(mockProduct);
      useCustomerCartStore.getState().addItem(mockProduct2);

      const idToRemove = useCustomerCartStore.getState().items[0].id;
      useCustomerCartStore.getState().removeItem(idToRemove);

      const state = useCustomerCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].product.id).toBe('prod-2');
    });
  });

  describe('clear', () => {
    it('should empty cart and reset all fields', () => {
      useCustomerCartStore.getState().addItem(mockProduct);
      useCustomerCartStore.getState().setTip(10);
      useCustomerCartStore.getState().setPromoCode('SAVE10');
      useCustomerCartStore.getState().setNotes('Test note');
      useCustomerCartStore.getState().setFulfillment({
        method: 'pickup',
        locationId: 'loc-1',
      });

      useCustomerCartStore.getState().clear();

      const state = useCustomerCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.tip).toBe(0);
      expect(state.promoCode).toBeNull();
      expect(state.notes).toBeNull();
      expect(state.fulfillment).toBeNull();
    });
  });

  describe('selectCustomerSubtotal', () => {
    it('should calculate correct subtotal with option modifiers', () => {
      useCustomerCartStore.getState().addItem(mockProduct, {
        selectedOptions: [
          { groupId: 'g1', groupName: 'Size', optionId: 'o1', optionName: 'Large', priceAdjustment: 20 },
        ],
      });
      // Item: (50 + 20) * 1 = 70
      useCustomerCartStore.getState().addItem(mockProduct2);
      // Item: 80 * 1 = 80

      const state = useCustomerCartStore.getState();
      const subtotal = selectCustomerSubtotal(state);

      expect(subtotal).toBe(150);
    });

    it('should account for quantity in subtotal', () => {
      useCustomerCartStore.getState().addItem(mockProduct);
      const id = useCustomerCartStore.getState().items[0].id;
      useCustomerCartStore.getState().incrementItem(id);
      useCustomerCartStore.getState().incrementItem(id);
      // quantity = 3, price = 50 * 3 = 150

      const subtotal = selectCustomerSubtotal(useCustomerCartStore.getState());
      expect(subtotal).toBe(150);
    });

    it('should return 0 for empty cart', () => {
      const subtotal = selectCustomerSubtotal(useCustomerCartStore.getState());
      expect(subtotal).toBe(0);
    });
  });

  describe('selectCustomerTotalItems', () => {
    it('should sum all quantities', () => {
      useCustomerCartStore.getState().addItem(mockProduct);
      useCustomerCartStore.getState().addItem(mockProduct2);
      const id = useCustomerCartStore.getState().items[0].id;
      useCustomerCartStore.getState().incrementItem(id); // first item qty=2

      const total = selectCustomerTotalItems(useCustomerCartStore.getState());
      expect(total).toBe(3); // 2 + 1
    });

    it('should return 0 for empty cart', () => {
      const total = selectCustomerTotalItems(useCustomerCartStore.getState());
      expect(total).toBe(0);
    });
  });

  describe('setFulfillment', () => {
    it('should update fulfillment info', () => {
      useCustomerCartStore.getState().setFulfillment({
        method: 'delivery',
        locationId: 'loc-1',
        deliveryAddressId: 'addr-1',
        scheduledDate: '2026-04-10',
      });

      const state = useCustomerCartStore.getState();
      expect(state.fulfillment).toEqual(
        expect.objectContaining({
          method: 'delivery',
          locationId: 'loc-1',
          deliveryAddressId: 'addr-1',
        }),
      );
    });

    it('should allow clearing fulfillment', () => {
      useCustomerCartStore.getState().setFulfillment({
        method: 'pickup',
        locationId: 'loc-1',
      });
      useCustomerCartStore.getState().setFulfillment(null);

      expect(useCustomerCartStore.getState().fulfillment).toBeNull();
    });
  });

  describe('setTip', () => {
    it('should update tip amount', () => {
      useCustomerCartStore.getState().setTip(25);

      expect(useCustomerCartStore.getState().tip).toBe(25);
    });
  });
});
