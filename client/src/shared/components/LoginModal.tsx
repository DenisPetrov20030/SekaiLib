import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema } from '../../features/auth/validation';
import type { LoginFormData } from '../../features/auth/validation';
import { useAuth } from '../../features/auth/hooks';
import { ROUTES } from '../../core/constants';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { login, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      reset();
      onClose();
      onSuccess?.();
    } catch {
      // Error handled in store
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-surface rounded-xl shadow-2xl border border-surface-hover"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
            Увійти в акаунт
          </h2>
          <p className="text-center text-sm text-text-secondary mb-8">
            Or{' '}
            <Link
              to={ROUTES.REGISTER}
              onClick={onClose}
              className="font-medium text-primary-500 hover:text-primary-400"
            >
              Створити новий акаунт
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-text-secondary mb-1">
                Пошта
              </label>
              <input
                {...register('email')}
                type="email"
                id="modal-email"
                className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="modal-password" className="block text-sm font-medium text-text-secondary mb-1">
                  Пароль
              </label>
              <input
                {...register('password')}
                type="password"
                id="modal-password"
                className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/20 p-3 border border-red-900/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Входжу...' : 'Увійти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
