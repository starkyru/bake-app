import { Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-[#faf3e8] p-4 text-[#8b4513]">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-[#3e2723]">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            'mt-4 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white',
            'transition-all duration-150 hover:bg-[#5d4037] active:scale-95',
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
