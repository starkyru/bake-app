import { cn } from '../lib/utils';

const statusColorMap: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  in_stock: 'bg-green-100 text-green-800 border-green-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  paid: 'bg-green-100 text-green-800 border-green-200',

  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  low_stock: 'bg-amber-100 text-amber-800 border-amber-200',
  draft: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-amber-100 text-amber-800 border-amber-200',

  cancelled: 'bg-red-100 text-red-800 border-red-200',
  out_of_stock: 'bg-red-100 text-red-800 border-red-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
};

function getStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/[\s-]/g, '_');
  return statusColorMap[normalized] ?? 'bg-gray-100 text-gray-800 border-gray-200';
}

function formatLabel(status: string): string {
  return status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        getStatusColor(status),
      )}
    >
      {formatLabel(status)}
    </span>
  );
}
