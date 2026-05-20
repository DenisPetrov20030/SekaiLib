import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Dialog } from '../components/Dialog';

interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

interface AlertOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions;
  resolve: (confirmed: boolean) => void;
}

interface AlertState {
  isOpen: boolean;
  options: AlertOptions;
  resolve: () => void;
}

interface DialogContextValue {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [alertDialog, setAlertDialog] = useState<AlertState | null>(null);

  const resolveRef = useRef<((v: boolean) => void) | null>(null);
  const alertResolveRef = useRef<(() => void) | null>(null);

  const confirm = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ isOpen: true, options, resolve });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      alertResolveRef.current = resolve;
      setAlertDialog({ isOpen: true, options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setDialog(null);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setDialog(null);
  };

  const handleAlertClose = () => {
    alertResolveRef.current?.();
    setAlertDialog(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog?.isOpen && (
        <Dialog
          isOpen={dialog.isOpen}
          title={dialog.options.title}
          message={dialog.options.message}
          confirmLabel={dialog.options.confirmLabel ?? 'Підтвердити'}
          cancelLabel={dialog.options.cancelLabel ?? 'Скасувати'}
          variant={dialog.options.variant ?? 'default'}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {alertDialog?.isOpen && (
        <Dialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.options.title}
          message={alertDialog.options.message}
          confirmLabel={alertDialog.options.confirmLabel ?? 'OK'}
          onConfirm={handleAlertClose}
          onCancel={handleAlertClose}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside DialogProvider');
  return ctx;
}
