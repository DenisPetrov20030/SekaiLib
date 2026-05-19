import { useState, useEffect } from 'react';
import { blocksApi } from '../../core/api/blocks';
import { useAppSelector } from '../../app/store/hooks';
import { Button } from './Button';

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
    <Button
      onClick={toggle}
      disabled={toggling}
      variant={blocked ? 'secondary' : 'primary'}
      size="md"
      className={className}
    >
      {toggling ? '...' : blocked ? 'Розблокувати' : 'Заблокувати'}
    </Button>
  );
}
