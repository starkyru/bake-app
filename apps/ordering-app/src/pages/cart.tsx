import { useNavigate } from 'react-router';
import { ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import {
  useCustomerCartStore,
  selectCustomerSubtotal,
  selectCustomerTotalItems,
} from '@bake-app/react/store';
import { QuantityControl } from '../components/quantity-control';

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

const TAX_RATE = 0.08; // 8% default, could come from location config

export function CartPage() {
  const navigate = useNavigate();
  const items = useCustomerCartStore((s) => s.items);
  const updateItem = useCustomerCartStore((s) => s.updateItem);
  const removeItem = useCustomerCartStore((s) => s.removeItem);
  const clear = useCustomerCartStore((s) => s.clear);
  const subtotal = useCustomerCartStore(selectCustomerSubtotal);
  const totalItems = useCustomerCartStore(selectCustomerTotalItems);

  const taxEstimate = subtotal * TAX_RATE;
  const total = subtotal + taxEstimate;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingBag
          className="mx-auto h-16 w-16 opacity-20"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <h2 className="mt-4 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Your cart is empty
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Add some delicious items from our menu to get started.
        </p>
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="mt-6 rounded-full px-6 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            aria-label="Back to menu"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: 'var(--color-text)' }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Your Cart
            <span
              className="ml-2 text-sm font-normal"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium text-red-500 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      {/* Cart items */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const optionsPrice = item.selectedOptions.reduce(
            (sum, o) => sum + o.priceAdjustment,
            0,
          );
          const itemTotal = (item.product.price + optionsPrice) * item.quantity;

          return (
            <div
              key={item.id}
              className="p-4"
              style={{
                backgroundColor: 'var(--color-card)',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {item.product.name}
                  </h3>
                  {item.selectedOptions.length > 0 && (
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {item.selectedOptions.map((o) => o.optionName).join(', ')}
                    </p>
                  )}
                  {item.customText && (
                    <p className="mt-0.5 text-xs italic" style={{ color: 'var(--color-accent)' }}>
                      &ldquo;{item.customText}&rdquo;
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${item.product.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <QuantityControl
                  value={item.quantity}
                  onChange={(q) => updateItem(item.id, { quantity: q })}
                />
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {formatPrice(itemTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      <div
        className="mt-6 p-4"
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Order Summary
        </h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
            <span className="font-mono" style={{ color: 'var(--color-text)' }}>
              {formatPrice(subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-muted)' }}>Tax (estimated)</span>
            <span className="font-mono" style={{ color: 'var(--color-text)' }}>
              {formatPrice(taxEstimate)}
            </span>
          </div>
          <div className="mt-1 flex justify-between border-t border-black/5 pt-2">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Total
            </span>
            <span
              className="font-mono text-base font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout button */}
      <button
        type="button"
        onClick={() => navigate('/checkout')}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 font-semibold text-white transition-colors"
        style={{
          backgroundColor: 'var(--color-primary)',
          borderRadius: 'var(--radius)',
        }}
      >
        Continue to Checkout
      </button>
    </div>
  );
}
