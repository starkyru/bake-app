import { cn } from '../lib/utils';

export interface CurrencyDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export function CurrencyDisplay({ amount, size = 'md' }: CurrencyDisplayProps) {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span
      className={cn(
        'font-mono font-semibold text-[#3e2723]',
        sizeClasses[size],
      )}
    >
      ${formatted}
    </span>
  );
}
