import { useState, useEffect } from 'react';
import { reportsApi } from '../../../core/api/reports';
import { ReportStatus, ReportTargetType } from '../../../core/types/enums';
import type { Report } from '../../../core/types/entities';

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
};

const STATUS_COLORS: Record<number, string> = {
  [ReportStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
  [ReportStatus.Reviewed]: 'bg-green-500/20 text-green-400',
  [ReportStatus.Dismissed]: 'bg-surface-600 text-text-muted',
};

export function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadReports(page);
  }, [page]);

  const loadReports = async (p: number) => {
    setLoading(true);
    try {
      const res = await reportsApi.getAll(p, 20);
      setReports(res.data.data);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId: string, status: typeof ReportStatus[keyof typeof ReportStatus]) => {
    try {
      const res = await reportsApi.review(reportId, { status, adminNote: adminNote || undefined });
      setReports((prev) => prev.map((r) => (r.id === reportId ? res.data : r)));
      setReviewingId(null);
      setAdminNote('');
    } catch {
      alert('Помилка при оновленні скарги');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Скарги</h1>

      <div className="bg-surface-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-text-muted text-center py-8">Скарг немає</p>
        ) : (
          <div className="divide-y divide-surface-700">
            {reports.map((report) => (
              <div key={report.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[report.status]}`}>
                        {STATUS_LABELS[report.status]}
                      </span>
                      <span className="text-xs bg-surface-700 text-text-muted px-2 py-0.5 rounded">
                        {TARGET_LABELS[report.targetType]}
                      </span>
                    </div>
                    <p className="font-medium text-text-primary">{report.reason}</p>
                    {report.description && (
                      <p className="text-sm text-text-muted mt-1">{report.description}</p>
                    )}
                  </div>
                  {report.status === ReportStatus.Pending && (
                    <button
                      onClick={() => setReviewingId(reviewingId === report.id ? null : report.id)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors shrink-0"
                    >
                      Розглянути
                    </button>
                  )}
                </div>
                <div className="text-xs text-text-muted flex gap-3">
                  <span>Від: {report.reporterUsername}</span>
                  <span>·</span>
                  <span>ID цілі: {report.targetId.slice(0, 8)}...</span>
                  <span>·</span>
                  <span>{new Date(report.createdAt).toLocaleDateString('uk-UA')}</span>
                </div>
                {report.adminNote && (
                  <div className="mt-2 text-sm bg-surface-700 rounded px-3 py-2 text-text-secondary">
                    Примітка адміна: {report.adminNote}
                  </div>
                )}
                {reviewingId === report.id && (
                  <div className="mt-4 space-y-3 border-t border-surface-700 pt-4">
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Примітка (необов'язково)"
                      className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(report.id, ReportStatus.Reviewed)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Прийняти
                      </button>
                      <button
                        onClick={() => handleReview(report.id, ReportStatus.Dismissed)}
                        className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors"
                      >
                        Відхилити
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-surface-800 text-text-primary disabled:opacity-40 hover:bg-surface-700 transition-colors"
          >
            ←
          </button>
          <span className="px-4 py-2 text-text-muted">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-surface-800 text-text-primary disabled:opacity-40 hover:bg-surface-700 transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
