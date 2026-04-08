import {
  useCartStore,
  selectSubtotal,
  selectTax,
  selectTotal,
  selectTotalItems,
  CartStore,
  CartProduct,
} from './cart-store';

describe('cart-store — BigNumber precision', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  const mkProduct = (id: string, price: number): CartProduct => ({
    id,
    name: `Product ${id}`,
    price,
    category: 'test',
  });

  describe('selectSubtotal', () => {
    it('should handle 0.1 + 0.2 price accumulation exactly', () => {
      useCartStore.setState({
        items: [
          { product: mkProduct('a', 0.1), quantity: 1 },
          { product: mkProduct('b', 0.2), quantity: 1 },
        ],
      });

      const subtotal = selectSubtotal(useCartStore.getState());
      // Must be exactly 0.3, not 0.30000000000000004
      expect(subtotal).toBe(0.3);
    });

    it('should handle 19.99 * 3 correctly', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 19.99), quantity: 3 }],
      });

      expect(selectSubtotal(useCartStore.getState())).toBe(59.97);
    });

    it('should accumulate many small prices without drift', () => {
      // 10 items at $0.1 each should be exactly $1.00
      const items = Array.from({ length: 10 }, (_, i) => ({
        product: mkProduct(`p${i}`, 0.1),
        quantity: 1,
      }));
      useCartStore.setState({ items });

      expect(selectSubtotal(useCartStore.getState())).toBe(1);
    });

    it('should return 0 for empty cart', () => {
      expect(selectSubtotal(useCartStore.getState())).toBe(0);
    });

    it('should return a number type, not a BigNumber instance', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 25), quantity: 2 }],
      });

      const result = selectSubtotal(useCartStore.getState());
      expect(typeof result).toBe('number');
    });

    it('should handle $0.01 * 100 = $1.00 exactly', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 0.01), quantity: 100 }],
      });

      expect(selectSubtotal(useCartStore.getState())).toBe(1);
    });
  });

  describe('selectTax', () => {
    it('should compute 12% tax on 33.33 with proper rounding', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 33.33), quantity: 1 }],
      });

      // 33.33 * 0.12 = 3.9996 -> rounded to 4.00
      expect(selectTax(useCartStore.getState())).toBe(4);
    });

    it('should compute tax with 2 decimal places', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 10.50), quantity: 1 }],
      });

      // 10.50 * 0.12 = 1.26
      expect(selectTax(useCartStore.getState())).toBe(1.26);
    });

    it('should handle tax on 0.1 + 0.2 subtotal', () => {
      useCartStore.setState({
        items: [
          { product: mkProduct('a', 0.1), quantity: 1 },
          { product: mkProduct('b', 0.2), quantity: 1 },
        ],
      });

      // subtotal = 0.3, tax = 0.3 * 0.12 = 0.036 -> 0.04
      expect(selectTax(useCartStore.getState())).toBe(0.04);
    });

    it('should return a number type', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 50), quantity: 1 }],
      });

      expect(typeof selectTax(useCartStore.getState())).toBe('number');
    });
  });

  describe('selectTotal', () => {
    it('should be subtotal + tax', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 100), quantity: 1 }],
      });

      // subtotal = 100, tax = 12, total = 112
      expect(selectTotal(useCartStore.getState())).toBe(112);
    });

    it('should maintain precision through the full chain', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 33.33), quantity: 1 }],
      });

      const subtotal = selectSubtotal(useCartStore.getState());
      const tax = selectTax(useCartStore.getState());
      const total = selectTotal(useCartStore.getState());

      expect(subtotal).toBe(33.33);
      expect(tax).toBe(4); // 33.33 * 0.12 = 3.9996 -> 4.00
      expect(total).toBe(37.33); // 33.33 + 4.00
    });

    it('should return a number type', () => {
      useCartStore.setState({
        items: [{ product: mkProduct('a', 50), quantity: 2 }],
      });

      expect(typeof selectTotal(useCartStore.getState())).toBe('number');
    });
  });

  describe('selectTotalItems', () => {
    it('should sum quantities', () => {
      useCartStore.setState({
        items: [
          { product: mkProduct('a', 10), quantity: 3 },
          { product: mkProduct('b', 20), quantity: 5 },
        ],
      });

      expect(selectTotalItems(useCartStore.getState())).toBe(8);
    });
  });
});
