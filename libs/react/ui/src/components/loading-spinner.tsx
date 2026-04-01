import { cn } from '../lib/utils';

export interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message, fullPage = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8b4513]/20 border-t-[#8b4513]" />
      {message && (
        <p className="text-sm font-medium text-[#5d4037]">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-[#faf3e8]/80 backdrop-blur-sm',
        )}
      >
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
}
