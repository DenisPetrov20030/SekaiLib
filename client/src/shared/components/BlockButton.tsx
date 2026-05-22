import { useState, useEffect } from 'react';
import { blocksApi } from '../../core/api/blocks';
import { useAppSelector } from '../../app/store/hooks';
import { Button } from './Button';
import { useDialog } from '../hooks/useDialog';

interface BlockButtonProps {
  userId: string;
  className?: string;
  onBlockChange?: (isBlocked: boolean) => void;
}

export function BlockButton({ userId, className, onBlockChange }: BlockButtonProps) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const { confirm, alert } = useDialog();

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
        onBlockChange?.(false);
      } else {
        const ok = await confirm({
          title: 'Заблокувати користувача?',
          message: 'Ви більше не бачитимете його контент.',
          confirmLabel: 'Заблокувати',
          variant: 'danger',
        });
        if (!ok) { setToggling(false); return; }
        await blocksApi.block(userId);
        setBlocked(true);
        onBlockChange?.(true);
      }
    } catch {
      await alert({ title: 'Помилка', message: 'Не вдалося виконати дію' });
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
