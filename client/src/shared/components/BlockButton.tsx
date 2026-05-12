import { useState, useEffect } from 'react';
import { blocksApi } from '../../core/api/blocks';
import { useAppSelector } from '../../app/store/hooks';

interface BlockButtonProps {
  userId: string;
  className?: string;
}

export function BlockButton({ userId, className }: BlockButtonProps) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.id === userId) return;
    blocksApi.isBlocked(userId)
      .then((res) => setBlocked(res.data))
      .finally(() => setLoading(false));
  }, [userId, currentUser]);

  if (!currentUser || currentUser.id === userId) return null;

  const toggle = async () => {
    setToggling(true);
    try {
      if (blocked) {
        await blocksApi.unblock(userId);
        setBlocked(false);
      } else {
        if (!confirm('Заблокувати цього користувача? Ви більше не бачитимете його контент.')) return;
        await blocksApi.block(userId);
        setBlocked(true);
      }
    } catch {
      alert('Помилка');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      className={
        className ??
        `inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 px-4 py-2 ${
          blocked
            ? 'bg-surface-700 hover:bg-surface-600 text-text-primary'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`
      }
    >
      {toggling ? '...' : blocked ? 'Розблокувати' : 'Заблокувати'}
    </button>
  );
}
