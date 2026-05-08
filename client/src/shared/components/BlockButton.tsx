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
        `text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          blocked
            ? 'bg-surface-700 hover:bg-surface-600 text-text-muted'
            : 'bg-red-600/20 hover:bg-red-600/40 text-red-400'
        }`
      }
    >
      {toggling ? '...' : blocked ? 'Розблокувати' : 'Заблокувати'}
    </button>
  );
}
