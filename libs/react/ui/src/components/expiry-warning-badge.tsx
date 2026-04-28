import { useMemo } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ExpiryWarningBadgeProps {
  expiryDate: Date | string;
  size?: 'sm' | 'md';
}

function formatRelativeTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
    return `${mins}m left`;
  }
  if (hours < 24) {
    return `${hours}h left`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ExpiryWarningBadge({ expiryDate, size = 'md' }: ExpiryWarningBadgeProps) {
  const expiry = useMemo(
    () => (expiryDate instanceof Date ? expiryDate : new Date(expiryDate)),
    [expiryDate],
  );

  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  const isExpired = diff <= 0;
  const hoursLeft = diff / (1000 * 60 * 60);

  const iconSize = size === 'sm' ? 12 : 14;
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  // Expired
  if (isExpired) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 font-medium text-red-800',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        )}
      >
        EXPIRED
      </span>
    );
  }

  // Less than 24 hours
  if (hoursLeft < 24) {
    return (
      <span className={cn('inline-flex items-center gap-1 font-medium text-red-600', textClass)}>
        <AlertTriangle size={iconSize} />
        {formatRelativeTime(diff)}
      </span>
    );
  }

  // Less than 72 hours
  if (hoursLeft < 72) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 font-medium text-amber-600', textClass)}
      >
        <Clock size={iconSize} />
        {formatRelativeTime(diff)}
      </span>
    );
  }

  // More than 72 hours
  return (
    <span className={cn('inline-flex items-center gap-1 text-gray-500', textClass)}>
      {formatShortDate(expiry)}
    </span>
  );
}
