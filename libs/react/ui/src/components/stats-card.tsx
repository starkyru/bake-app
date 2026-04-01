import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary: {
    bg: 'bg-[#faf3e8]',
    icon: 'bg-[#8b4513]/10 text-[#8b4513]',
    border: 'border-[#8b4513]/10',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-700',
    border: 'border-green-100',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100',
  },
  danger: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-700',
    border: 'border-red-100',
  },
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm transition-all duration-150 hover:shadow-md',
        colors.bg,
        colors.border,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="font-mono text-2xl font-bold text-[#3e2723]">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend.value >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              <span
                className={cn(
                  'font-medium',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', colors.icon)}>{icon}</div>
      </div>
    </div>
  );
}
