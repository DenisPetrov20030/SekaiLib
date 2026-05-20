import { useState, useEffect } from 'react';
import { bansApi } from '../../../core/api/bans';
import type { UserBan } from '../../../core/types/entities';
import { useDialog } from '../../../shared/hooks/useDialog';

export function AdminBansPage() {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { confirm, alert } = useDialog();

  useEffect(() => {
    loadBans();
  }, []);

  const loadBans = async () => {
    setLoading(true);
    try {
      const res = await bansApi.getActiveBans();
      setBans(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !reason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await bansApi.banUser(userId.trim(), {
        reason,
        expiresAt: expiresAt || undefined,
      });
      setUserId('');
      setReason('');
      setExpiresAt('');
      await loadBans();
    } catch {
      setError('Не вдалося заблокувати користувача. Перевірте ID.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnban = async (banId: string) => {
    const ok = await confirm({ title: 'Зняти бан?', confirmLabel: 'Зняти' });
    if (!ok) return;
    try {
      await bansApi.unban(banId);
      setBans((prev) => prev.filter((b) => b.id !== banId));
    } catch {
      await alert({ title: 'Помилка', message: 'Не вдалося зняти бан' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Бани користувачів</h1>

      <div className="bg-surface-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Заблокувати користувача</h2>
        <form onSubmit={handleBan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">ID користувача</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="UUID користувача"
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Термін дії (необов'язково)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Причина</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Причина блокування"
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Блокування...' : 'Заблокувати'}
          </button>
        </form>
      </div>

      <div className="bg-surface-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-text-primary">Активні бани ({bans.length})</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : bans.length === 0 ? (
          <p className="text-text-muted text-center py-8">Немає активних банів</p>
        ) : (
          <div className="divide-y divide-surface-700">
            {bans.map((ban) => (
              <div key={ban.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">{ban.username}</span>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">забанений</span>
                  </div>
                  <p className="text-sm text-text-muted">Причина: {ban.reason}</p>
                  <p className="text-xs text-text-muted mt-1">
                    Заблокував: {ban.bannedByUsername} · {new Date(ban.createdAt).toLocaleDateString('uk-UA')}
                    {ban.expiresAt && ` · До: ${new Date(ban.expiresAt).toLocaleDateString('uk-UA')}`}
                  </p>
                </div>
                <button
                  onClick={() => handleUnban(ban.id)}
                  className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors shrink-0"
                >
                  Зняти бан
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
