import { useCallback, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-[#3e2723]">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700',
              'transition-all duration-150 hover:bg-gray-50',
            )}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white',
              'transition-all duration-150 active:scale-95',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#8b4513] hover:bg-[#5d4037]',
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (title: string, message: string, options?: Partial<ConfirmOptions>) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({ title, message, ...options });
      });
    },
    [],
  );

  const handleClose = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState(null);
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState(null);
  }, []);

  const dialog = state ? (
    <ConfirmationDialog
      open
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
    />
  ) : null;

  return { confirm, ConfirmationDialog: dialog };
}
