import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, loginSchema } from '../../features/auth/validation';
import type { RegisterFormData, LoginFormData } from '../../features/auth/validation';
import { useAuth } from '../../features/auth/hooks';

interface AuthDialogProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthDialog = ({ isOpen, initialMode = 'login', onClose, onSuccess }: AuthDialogProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { login, register: registerUser, startOAuth, loading, error } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

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

  const title = useMemo(() => (mode === 'login' ? 'Увійти в акаунт' : 'Створити акаунт'), [mode]);

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      loginForm.reset();
      onClose();
      onSuccess?.();
    } catch {
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...payload } = data;
      await registerUser(payload);
      registerForm.reset();
      onClose();
      onSuccess?.();
    } catch {
    }
  };

  const handleOAuth = (provider: 'google') => {
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    startOAuth(provider, returnUrl);
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
          <h2 className="text-2xl font-bold text-text-primary text-center mb-4">{title}</h2>

          <div className="mb-6 grid grid-cols-2 rounded-lg bg-background p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-primary-600 text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Вхід
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-primary-600 text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Реєстрація
            </button>
          </div>

          <div className="mb-5">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="w-full rounded-lg border border-surface-hover bg-background px-4 py-2.5 text-sm font-medium text-text-primary hover:border-primary-500"
            >
              Continue with Google
            </button>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-hover"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-muted">або</span>
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
              <div>
                <label htmlFor="dialog-email" className="block text-sm font-medium text-text-secondary mb-1">
                  Пошта
                </label>
                <input
                  {...loginForm.register('email')}
                  type="email"
                  id="dialog-email"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  placeholder="you@example.com"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dialog-password" className="block text-sm font-medium text-text-secondary mb-1">
                  Пароль
                </label>
                <input
                  {...loginForm.register('password')}
                  type="password"
                  id="dialog-password"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
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
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Вхід...' : 'Увійти'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
              <div>
                <label htmlFor="dialog-register-email" className="block text-sm font-medium text-text-secondary mb-1">
                  Пошта
                </label>
                <input
                  {...registerForm.register('email')}
                  type="email"
                  id="dialog-register-email"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dialog-register-username" className="block text-sm font-medium text-text-secondary mb-1">
                  Ім'я користувача
                </label>
                <input
                  {...registerForm.register('username')}
                  type="text"
                  id="dialog-register-username"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dialog-register-password" className="block text-sm font-medium text-text-secondary mb-1">
                  Пароль
                </label>
                <input
                  {...registerForm.register('password')}
                  type="password"
                  id="dialog-register-password"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dialog-register-confirm" className="block text-sm font-medium text-text-secondary mb-1">
                  Підтвердження пароля
                </label>
                <input
                  {...registerForm.register('confirmPassword')}
                  type="password"
                  id="dialog-register-confirm"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
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
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Реєстрація...' : 'Створити акаунт'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
