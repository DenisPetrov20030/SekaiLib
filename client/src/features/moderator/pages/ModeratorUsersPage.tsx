import { useState } from 'react';
import { moderationApi, type UserSearchResultDto, type UserWarningDto } from '../../../core/api/moderation';
import { bansApi } from '../../../core/api/bans';
import { UserRole } from '../../../core/types/enums';

const ROLE_LABELS: Record<number, string> = {
  [UserRole.User]: 'Користувач',
  [UserRole.Moderator]: 'Модератор',
  [UserRole.Administrator]: 'Адміністратор',
};

export function ModeratorUsersPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResultDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<Record<string, UserWarningDto[]>>({});
  const [warnUserId, setWarnUserId] = useState<string | null>(null);
  const [warnReason, setWarnReason] = useState('');
  const [expandedWarnings, setExpandedWarnings] = useState<string | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    moderationApi.searchUsers(query)
      .then((r) => setResults(r.data))
      .finally(() => setLoading(false));
  };

  const loadWarnings = async (userId: string) => {
    if (expandedWarnings === userId) {
      setExpandedWarnings(null);
      return;
    }
    const r = await moderationApi.getUserWarnings(userId);
    setWarnings((prev) => ({ ...prev, [userId]: r.data }));
    setExpandedWarnings(userId);
  };

  const handleWarn = async () => {
    if (!warnUserId || !warnReason.trim()) return;
    await moderationApi.issueWarning(warnUserId, warnReason);
    setWarnUserId(null);
    setWarnReason('');
    // refresh search
    const r = await moderationApi.searchUsers(query);
    setResults(r.data);
  };

  const handleRevokeWarning = async (warningId: string, userId: string) => {
    await moderationApi.revokeWarning(warningId);
    const r = await moderationApi.getUserWarnings(userId);
    setWarnings((prev) => ({ ...prev, [userId]: r.data }));
  };

  const handleBan = async (userId: string) => {
    await bansApi.banUser(userId, { reason: 'Заблоковано модератором' });
    const r = await moderationApi.searchUsers(query);
    setResults(r.data);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Пошук користувачів</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Нікнейм..."
          className="flex-1 bg-surface-800 border border-surface-600 rounded-lg px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg disabled:opacity-50"
        >
          Знайти
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-4">
        {results.map((user) => (
          <div key={user.id} className="bg-surface-800 rounded-lg p-5">
            <div className="flex items-center gap-4 mb-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-text-muted text-lg">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-text-primary">{user.username}</p>
                <p className="text-xs text-text-muted">{ROLE_LABELS[user.role]}</p>
              </div>
              <div className="flex items-center gap-3">
                {user.isBanned && (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Заблоковано</span>
                )}
                {user.warningCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    {user.warningCount} попередж.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setWarnUserId(user.id); setWarnReason(''); }}
                className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded-lg"
              >
                Попередити
              </button>
              {!user.isBanned && (
                <button
                  onClick={() => handleBan(user.id)}
                  className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white text-xs rounded-lg"
                >
                  Заблокувати
                </button>
              )}
              <button
                onClick={() => loadWarnings(user.id)}
                className="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-text-secondary text-xs rounded-lg"
              >
                {expandedWarnings === user.id ? 'Сховати' : 'Попередження'}
              </button>
            </div>

            {expandedWarnings === user.id && (
              <div className="mt-3 space-y-2">
                {(warnings[user.id] ?? []).length === 0 ? (
                  <p className="text-xs text-text-muted">Попереджень немає</p>
                ) : (
                  (warnings[user.id] ?? []).map((w) => (
                    <div key={w.id} className={`flex items-start justify-between gap-2 bg-surface-900 rounded p-3 ${!w.isActive ? 'opacity-50' : ''}`}>
                      <div>
                        <p className="text-sm text-text-primary">{w.reason}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          від {w.issuedByUsername} · {new Date(w.createdAt).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      {w.isActive && (
                        <button
                          onClick={() => handleRevokeWarning(w.id, user.id)}
                          className="text-xs text-red-400 hover:text-red-300 shrink-0"
                        >
                          Скасувати
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Warn modal */}
      {warnUserId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Попередження</h3>
            <textarea
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder="Причина..."
              className="w-full bg-surface-900 border border-surface-600 rounded-lg px-3 py-2 text-text-primary text-sm resize-none h-24 mb-4 focus:outline-none focus:border-primary-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setWarnUserId(null)}
                className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary text-sm rounded-lg"
              >
                Скасувати
              </button>
              <button
                onClick={handleWarn}
                disabled={!warnReason.trim()}
                className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-lg disabled:opacity-50"
              >
                Надіслати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
