import { Plus } from 'lucide-react';
import { CurrencyDisplay } from './currency-display';
import { cn } from '../lib/utils';

export interface ProductCardProps {
  name: string;
  price: number;
  category?: string;
  onAddToCart: () => void;
}

export function ProductCard({
  name,
  price,
  category,
  onAddToCart,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-[#8b4513]/10',
        'bg-white p-4 shadow-sm transition-all duration-150 hover:shadow-md',
      )}
    >
      <div className="space-y-2">
        {category && (
          <span className="inline-block rounded-full bg-[#faf3e8] px-2 py-0.5 text-xs font-medium text-[#8b4513]">
            {category}
          </span>
        )}
        <h3 className="text-sm font-semibold text-[#3e2723] line-clamp-2">
          {name}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <CurrencyDisplay amount={price} size="md" />
        <button
          type="button"
          onClick={onAddToCart}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-[#8b4513] text-white shadow-sm',
            'transition-all duration-150 hover:bg-[#5d4037]',
            'active:scale-95',
          )}
          aria-label={`Add ${name} to cart`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
