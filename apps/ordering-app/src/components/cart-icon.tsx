import { ShoppingBag } from 'lucide-react';
import { useCustomerCartStore, selectCustomerTotalItems } from '@bake-app/react/store';

interface CartIconProps {
  onClick?: () => void;
}

export function CartIcon({ onClick }: CartIconProps) {
  const totalItems = useCustomerCartStore(selectCustomerTotalItems);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5"
      aria-label={`Cart with ${totalItems} items`}
    >
      <ShoppingBag className="h-6 w-6" style={{ color: 'var(--color-text)' }} />
      {totalItems > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}
