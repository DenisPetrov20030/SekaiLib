import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../../../core/api/reports';
import { bansApi } from '../../../core/api/bans';
import { moderationApi } from '../../../core/api/moderation';
import { ReportStatus, ReportTargetType } from '../../../core/types/enums';
import { useDialog } from '../../../shared/hooks/useDialog';
import type { Report } from '../../../core/types/entities';

const buildResourceLink = (report: Report): string | null => {
  const { targetType, targetId, targetUserId } = report;
  switch (targetType) {
    case ReportTargetType.User:
      return `/users/${targetId}`;
    case ReportTargetType.Title:
      return `/titles/${targetId}`;
    case ReportTargetType.ForumThread:
      return `/forum/threads/${targetId}`;
    case ReportTargetType.Review:
    case ReportTargetType.ReviewComment:
    case ReportTargetType.ChapterComment:
    case ReportTargetType.TitleComment:
    case ReportTargetType.ForumPost:
      return targetUserId ? `/users/${targetUserId}` : null;
    default:
      return null;
  }
};

const STATUS_LABELS: Record<number, string> = {
  [ReportStatus.Pending]: 'Очікує',
  [ReportStatus.Reviewed]: 'Розглянуто',
  [ReportStatus.Dismissed]: 'Відхилено',
};

const TARGET_LABELS: Record<number, string> = {
  [ReportTargetType.User]: 'Користувач',
  [ReportTargetType.Review]: 'Рецензія',
  [ReportTargetType.ReviewComment]: 'Коментар рецензії',
  [ReportTargetType.ChapterComment]: 'Коментар розділу',
  [ReportTargetType.Title]: 'Твір',
  [ReportTargetType.TitleComment]: 'Коментар твору',
};

const STATUS_COLORS: Record<number, string> = {
  [ReportStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
  [ReportStatus.Reviewed]: 'bg-green-500/20 text-green-400',
  [ReportStatus.Dismissed]: 'bg-zinc-700 text-text-muted',
};

export function ModeratorReportsPage() {
  const { confirm, alert } = useDialog();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [warnUserId, setWarnUserId] = useState<string | null>(null);
  const [warnReason, setWarnReason] = useState('');

  const pageSize = 20;

  const load = (p: number) => {
    setLoading(true);
    reportsApi.getAll(p, pageSize)
      .then((r: any) => {
        if (Array.isArray(r.data)) {
          setReports(r.data);
          setTotalCount(r.data.length);
        } else {
          setReports(r.data.data ?? r.data);
          setTotalCount(r.data.totalCount ?? 0);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  const handleDismiss = async (reportId: string) => {
    await reportsApi.review(reportId, { status: ReportStatus.Dismissed, adminNote: '' });
    load(page);
  };

  const handleMarkReviewed = async (reportId: string) => {
    await reportsApi.review(reportId, { status: ReportStatus.Reviewed, adminNote: '' });
    load(page);
  };

  const handleWarn = async () => {
    if (!warnUserId || !warnReason.trim()) return;
    await moderationApi.issueWarning(warnUserId, warnReason);
    setWarnUserId(null);
    setWarnReason('');
  };

  const handleBan = async (userId: string) => {
    const ok = await confirm({
      title: 'Забанити користувача?',
      message: 'Бан буде безстроковим. Підтвердіть дію.',
      confirmLabel: 'Забанити',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await bansApi.banUser(userId, { reason: 'Блокування за скаргою' });
      await alert({ title: 'Готово', message: 'Користувача забанено.' });
      load(page);
    } catch {
      await alert({ title: 'Помилка', message: 'Не вдалося забанити користувача.' });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Скарги</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">Скарг немає</div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-zinc-900 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-text-secondary">
                    {TARGET_LABELS[report.targetType] ?? `Type ${report.targetType}`}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
                <span className="text-xs text-text-muted shrink-0">
                  {new Date(report.createdAt).toLocaleString('uk-UA')}
                </span>
              </div>

              <p className="text-sm text-text-secondary mb-1">
                Від: <span className="font-medium text-text-primary">{report.reporterUsername}</span>
                {report.targetUsername && (
                  <> &rarr; <span className="font-medium text-text-primary">{report.targetUsername}</span></>
                )}
              </p>

              <p className="text-sm text-text-secondary">
                Причина: <span className="text-text-primary">{report.reason}</span>
              </p>

              {buildResourceLink(report) && (
                <div className="mt-2">
                  <Link
                    to={buildResourceLink(report)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 underline underline-offset-2"
                  >
                    Переглянути ресурс
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              )}

              {report.description && (
                <p className="text-sm text-text-muted mt-1 line-clamp-2">{report.description}</p>
              )}

              {report.status === ReportStatus.Pending && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => handleMarkReviewed(report.id)}
                    className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg"
                  >
                    Розглянуто
                  </button>
                  {report.targetUserId && (
                    <>
                      <button
                        onClick={() => { setWarnUserId(report.targetUserId!); setWarnReason(''); }}
                        className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-lg"
                      >
                        Попередити
                      </button>
                      <button
                        onClick={() => handleBan(report.targetUserId!)}
                        className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white text-sm rounded-lg"
                      >
                        Забанити
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDismiss(report.id)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-text-secondary text-sm rounded-lg"
                  >
                    Відхилити
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p); }}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="px-3 py-1 text-sm text-text-secondary">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => { const p = page + 1; setPage(p); load(p); }}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {/* Warn modal */}
      {warnUserId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4">
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
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-text-primary text-sm rounded-lg"
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
