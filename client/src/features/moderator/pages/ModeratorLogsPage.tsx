import { useEffect, useState } from 'react';
import { moderationApi, ModerationAction, type ModerationLogDto } from '../../../core/api/moderation';

const ACTION_LABELS: Record<number, string> = {
  [ModerationAction.BanUser]: 'Бан',
  [ModerationAction.UnbanUser]: 'Розбан',
  [ModerationAction.WarnUser]: 'Попередження',
  [ModerationAction.RevokeWarning]: 'Скасування попередження',
  [ModerationAction.ApproveContent]: 'Схвалення контенту',
  [ModerationAction.RejectContent]: 'Відхилення контенту',
  [ModerationAction.DeleteContent]: 'Видалення контенту',
  [ModerationAction.LockThread]: 'Блокування теми',
  [ModerationAction.PinThread]: 'Закріплення теми',
  [ModerationAction.ReviewReport]: 'Перегляд скарги',
  [ModerationAction.DismissReport]: 'Відхилення скарги',
};

const ACTION_COLORS: Record<number, string> = {
  [ModerationAction.BanUser]: 'bg-red-500/20 text-red-400',
  [ModerationAction.UnbanUser]: 'bg-green-500/20 text-green-400',
  [ModerationAction.WarnUser]: 'bg-yellow-500/20 text-yellow-400',
  [ModerationAction.RevokeWarning]: 'bg-surface-600 text-text-muted',
  [ModerationAction.ApproveContent]: 'bg-green-500/20 text-green-400',
  [ModerationAction.RejectContent]: 'bg-red-500/20 text-red-400',
  [ModerationAction.DeleteContent]: 'bg-red-500/20 text-red-400',
  [ModerationAction.LockThread]: 'bg-orange-500/20 text-orange-400',
  [ModerationAction.PinThread]: 'bg-blue-500/20 text-blue-400',
  [ModerationAction.ReviewReport]: 'bg-blue-500/20 text-blue-400',
  [ModerationAction.DismissReport]: 'bg-surface-600 text-text-muted',
};

export function ModeratorLogsPage() {
  const [logs, setLogs] = useState<ModerationLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const pageSize = 30;

  const load = (p: number) => {
    setLoading(true);
    moderationApi.getLogs(p, pageSize)
      .then((r) => {
        setLogs(r.data.data);
        setTotalCount(r.data.totalCount);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Журнал дій</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">Записів немає</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-surface-800 rounded-lg px-4 py-3 flex items-start gap-4">
              <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? 'bg-surface-600 text-text-muted'}`}>
                {ACTION_LABELS[log.action] ?? `Action ${log.action}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">
                  <span className="font-medium">{log.moderatorUsername}</span>
                  {log.targetType && (
                    <span className="text-text-secondary"> · {log.targetType}</span>
                  )}
                </p>
                {log.details && (
                  <p className="text-xs text-text-muted mt-0.5 truncate">{log.details}</p>
                )}
              </div>
              <span className="text-xs text-text-muted shrink-0">
                {new Date(log.createdAt).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p); }}
            className="px-3 py-1 bg-surface-700 hover:bg-surface-600 rounded text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="px-3 py-1 text-sm text-text-secondary">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => { const p = page + 1; setPage(p); load(p); }}
            className="px-3 py-1 bg-surface-700 hover:bg-surface-600 rounded text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
