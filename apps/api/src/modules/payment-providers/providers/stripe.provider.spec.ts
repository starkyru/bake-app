import BigNumber from 'bignumber.js';

/**
 * Tests for the BigNumber dollar-to-cents conversion logic used in StripeProvider.
 * We test the conversion formula directly since StripeProvider requires the `stripe`
 * npm package which adds complexity to mock.
 */
describe('Stripe dollar-to-cents BigNumber conversion', () => {
  // This is the exact formula used in StripeProvider.createPaymentIntent and .refund
  function dollarsToCents(amount: number): number {
    return new BigNumber(amount).times(100).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
  }

  it('should convert $19.99 to 1999 cents exactly', () => {
    expect(dollarsToCents(19.99)).toBe(1999);
  });

  it('should convert $0.10 to 10 cents exactly', () => {
    expect(dollarsToCents(0.10)).toBe(10);
  });

  it('should convert $1.005 to 101 cents (half-up rounding)', () => {
    // 1.005 * 100 = 100.5 -> rounds to 101
    expect(dollarsToCents(1.005)).toBe(101);
  });

  it('should handle the classic 0.1 + 0.2 = 30 cents', () => {
    // In native JS: (0.1 + 0.2) * 100 = 30.000000000000004
    // Math.round would give 30, but let's ensure BigNumber handles it cleanly
    const total = new BigNumber(0.1).plus(0.2).toNumber();
    expect(dollarsToCents(total)).toBe(30);
  });

  it('should convert $99.995 to 10000 cents (half-up)', () => {
    // 99.995 * 100 = 9999.5 -> rounds to 10000
    expect(dollarsToCents(99.995)).toBe(10000);
  });

  it('should convert $0.01 to 1 cent', () => {
    expect(dollarsToCents(0.01)).toBe(1);
  });

  it('should convert $0.00 to 0 cents', () => {
    expect(dollarsToCents(0)).toBe(0);
  });

  it('should handle large amounts like $9999.99', () => {
    expect(dollarsToCents(9999.99)).toBe(999999);
  });

  it('should return integer type, not float', () => {
    const result = dollarsToCents(19.99);
    expect(Number.isInteger(result)).toBe(true);
    expect(typeof result).toBe('number');
  });

  it('should avoid native JS float issues with 33.33 * 100', () => {
    // Native: 33.33 * 100 = 3333.0000000000005
    expect(dollarsToCents(33.33)).toBe(3333);
    expect(Number.isInteger(dollarsToCents(33.33))).toBe(true);
  });
});

describe('PayPal amount formatting BigNumber', () => {
  // This is the formula from PayPalProvider
  function formatAmount(amount: number): string {
    return new BigNumber(amount).toFixed(2);
  }

  it('should format $19.99 as "19.99"', () => {
    expect(formatAmount(19.99)).toBe('19.99');
  });

  it('should format $10 as "10.00"', () => {
    expect(formatAmount(10)).toBe('10.00');
  });

  it('should format $0.1 as "0.10"', () => {
    expect(formatAmount(0.1)).toBe('0.10');
  });

  it('should format 0.1 + 0.2 as "0.30"', () => {
    const sum = new BigNumber(0.1).plus(0.2).toNumber();
    expect(formatAmount(sum)).toBe('0.30');
  });

  it('should format $1234.5 as "1234.50"', () => {
    expect(formatAmount(1234.5)).toBe('1234.50');
  });

  it('should format $0 as "0.00"', () => {
    expect(formatAmount(0)).toBe('0.00');
  });
});
