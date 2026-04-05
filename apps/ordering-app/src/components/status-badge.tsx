import { OrderStatus } from '@bake-app/shared-types';

const statusConfig: Record<string, { label: string; color: string }> = {
  [OrderStatus.PENDING]: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  [OrderStatus.PENDING_APPROVAL]: {
    label: 'Awaiting Approval',
    color: 'bg-orange-100 text-orange-800',
  },
  [OrderStatus.CONFIRMED]: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  [OrderStatus.SCHEDULED]: { label: 'Scheduled', color: 'bg-indigo-100 text-indigo-800' },
  [OrderStatus.IN_PROGRESS]: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  [OrderStatus.READY_FOR_PICKUP]: {
    label: 'Ready for Pickup',
    color: 'bg-green-100 text-green-800',
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    label: 'Out for Delivery',
    color: 'bg-teal-100 text-teal-800',
  },
  [OrderStatus.DELIVERED]: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
  [OrderStatus.COMPLETED]: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
