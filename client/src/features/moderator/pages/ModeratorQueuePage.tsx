import { useEffect, useState } from 'react';
import { moderationApi, ModerationStatus, type ModerationQueueItemDto } from '../../../core/api/moderation';

const STATUS_LABELS: Record<number, string> = {
  [ModerationStatus.Pending]: 'Очікує',
  [ModerationStatus.Approved]: 'Схвалено',
  [ModerationStatus.Rejected]: 'Відхилено',
};

const FLAG_LABELS: Record<string, string> = {
  profanity: 'Нецензурна лексика',
  spam: 'Спам',
  caps_abuse: 'Зловживання капслоком',
  chapter_upload: 'Завантаження глави',
  automod: 'Авто-модерація',
};

const tabs: Array<{ label: string; status?: ModerationStatus }> = [
  { label: 'Очікують', status: ModerationStatus.Pending },
  { label: 'Схвалені', status: ModerationStatus.Approved },
  { label: 'Відхилені', status: ModerationStatus.Rejected },
];

export function ModeratorQueuePage() {
  const [activeStatus, setActiveStatus] = useState<ModerationStatus>(ModerationStatus.Pending);
  const [items, setItems] = useState<ModerationQueueItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pageSize = 20;

  const load = (p: number, s: ModerationStatus) => {
    setLoading(true);
    moderationApi.getQueue(p, pageSize, s)
      .then((r) => {
        setItems(r.data.data);
        setTotalCount(r.data.totalCount);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    load(1, activeStatus);
  }, [activeStatus]);

  const handleApprove = async (id: string) => {
    await moderationApi.approve(id);
    load(page, activeStatus);
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await moderationApi.reject(rejectId, rejectReason || undefined);
    setRejectId(null);
    setRejectReason('');
    load(page, activeStatus);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Черга модерації</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-surface-700">
        {tabs.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveStatus(tab.status!)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeStatus === tab.status
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">Елементів немає</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-surface-800 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-700 text-text-secondary mr-2">
                    {item.contentType}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    {FLAG_LABELS[item.flagReason] ?? item.flagReason}
                  </span>
                </div>
                <span className="text-xs text-text-muted shrink-0">
                  {new Date(item.createdAt).toLocaleString('uk-UA')}
                </span>
              </div>

              <p className="text-sm text-text-secondary mb-1">
                Автор: <span className="text-text-primary font-medium">{item.authorUsername}</span>
              </p>

              {item.contentSnapshot && (
                <div className="bg-surface-900 rounded p-3 mt-2 mb-3 text-sm text-text-secondary whitespace-pre-wrap line-clamp-5">
                  {item.contentSnapshot}
                </div>
              )}

              {item.status === ModerationStatus.Pending && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Схвалити
                  </button>
                  <button
                    onClick={() => { setRejectId(item.id); setRejectReason(''); }}
                    className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Відхилити
                  </button>
                </div>
              )}

              {item.status === ModerationStatus.Rejected && item.rejectionReason && (
                <p className="text-xs text-red-400 mt-2">Причина: {item.rejectionReason}</p>
              )}

              {item.status !== ModerationStatus.Pending && (
                <p className="text-xs text-text-muted mt-2">
                  {STATUS_LABELS[item.status]} — {item.reviewedByUsername}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p, activeStatus); }}
            className="px-3 py-1 bg-surface-700 hover:bg-surface-600 rounded text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="px-3 py-1 text-sm text-text-secondary">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => { const p = page + 1; setPage(p); load(p, activeStatus); }}
            className="px-3 py-1 bg-surface-700 hover:bg-surface-600 rounded text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Причина відхилення</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Необов'язково..."
              className="w-full bg-surface-900 border border-surface-600 rounded-lg px-3 py-2 text-text-primary text-sm resize-none h-24 mb-4 focus:outline-none focus:border-primary-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectId(null)}
                className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary text-sm rounded-lg"
              >
                Скасувати
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg"
              >
                Відхилити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
