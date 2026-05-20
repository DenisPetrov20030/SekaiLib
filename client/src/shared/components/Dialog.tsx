import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function Dialog({
  isOpen,
  title,
  message,
  children,
  confirmLabel = 'Підтвердити',
  cancelLabel = 'Скасувати',
  variant = 'default',
  onConfirm,
  onCancel,
}: DialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel?.();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md mx-4 bg-surface-800 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {message && (
            <p className="mt-2 text-sm text-text-secondary">{message}</p>
          )}
          {children && <div className="mt-2">{children}</div>}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          {onConfirm && (
            <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
