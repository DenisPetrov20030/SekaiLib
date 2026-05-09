import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch } from '../../app/store/hooks';
import { initializeAuth, logout } from '../../features/auth/store/authSlice';
import type { User } from '../../core/types';

interface BannedAccessScreenProps {
  user: User;
}

const formatRemainingTime = (targetDate: Date) => {
  const totalSeconds = Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} д ${hours} год ${minutes} хв`;
  }

  if (hours > 0) {
    return `${hours} год ${minutes} хв ${seconds} с`;
  }

  return `${minutes} хв ${seconds} с`;
};

export const BannedAccessScreen = ({ user }: BannedAccessScreenProps) => {
  const dispatch = useAppDispatch();
  const [now, setNow] = useState(Date.now());
  const expiryHandledRef = useRef(false);
  const banExpiresAt = user.banExpiresAt ? new Date(user.banExpiresAt) : null;
  const isPermanentBan = !banExpiresAt;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remainingText = useMemo(() => {
    if (!banExpiresAt) {
      return null;
    }

    const remaining = banExpiresAt.getTime() - now;
    if (remaining <= 0) {
      return 'Блокування закінчилося, перевіряємо доступ...';
    }

    return `До розблокування залишилось: ${formatRemainingTime(banExpiresAt)}`;
  }, [banExpiresAt, now]);

  useEffect(() => {
    if (!banExpiresAt || expiryHandledRef.current) {
      return;
    }

    if (banExpiresAt.getTime() <= now) {
      expiryHandledRef.current = true;
      void dispatch(initializeAuth());
    }
  }, [banExpiresAt, dispatch, now]);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.08),_transparent_28%)]" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

          <div className="p-6 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300 shadow-[0_0_0_8px_rgba(239,68,68,0.05)]">
                <span className="text-4xl font-black leading-none">!</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.35em] text-red-200">
                Заблоковано
              </div>

              <h1 className="mt-5 text-3xl font-black uppercase tracking-[0.18em] text-white sm:text-5xl">
                Доступ обмежено
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                Ваш акаунт тимчасово або безстроково заблоковано. Доступ до сайту буде недоступний, доки блокування не буде знято.
              </p>
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Користувач</div>
                <div className="mt-1 text-sm font-semibold text-white">{user.username}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Причина</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {user.banReason || 'Без вказаної причини'}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Статус</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {isPermanentBan ? 'Бан назавжди' : 'Тимчасовий бан'}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
              {isPermanentBan ? (
                <>
                  <div className="text-lg font-bold text-amber-300 sm:text-xl">Блокування діє безстроково</div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Для відновлення доступу зверніться до адміністрації.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm uppercase tracking-[0.3em] text-zinc-500">Залишилось часу</div>
                  <div className="mt-2 text-3xl font-black text-amber-300 sm:text-5xl">
                    {remainingText?.replace('До розблокування залишилось: ', '')}
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Після завершення таймера доступ буде перевірено автоматично.
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-500"
              >
                Вийти з акаунта
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
