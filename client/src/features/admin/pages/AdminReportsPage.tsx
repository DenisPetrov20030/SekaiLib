import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { reportsApi } from '../../../core/api/reports';
import { bansApi } from '../../../core/api/bans';
import { useDialog } from '../../../shared/hooks/useDialog';
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

const BAN_DURATIONS = [
  { value: '1d', label: '1 день' },
  { value: '3d', label: '3 дні' },
  { value: '7d', label: '7 днів' },
  { value: '30d', label: '30 днів' },
  { value: 'permanent', label: 'Назавжди' },
];

const BAN_REASON = 'Блокування за скаргою';
export function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { confirm, alert } = useDialog();
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [banDuration, setBanDuration] = useState('7d');
  const [banning, setBanning] = useState(false);

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
      await alert({ title: 'Помилка', message: 'Помилка при оновленні скарги' });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    const ok = await confirm({ title: 'Видалити цю скаргу?', confirmLabel: 'Видалити', variant: 'danger' });
    if (!ok) {
      return;
    }

    try {
      await reportsApi.delete(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }

      if (reports.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        await loadReports(page);
      }
    } catch {
      await alert({ title: 'Помилка', message: 'Помилка при видаленні скарги' });
    }
  };

  const handleOpenDetails = async (reportId: string) => {
    setDetailsLoading(true);
    try {
      const res = await reportsApi.getById(reportId);
      setSelectedReport(res.data);
    } catch {
      await alert({ title: 'Помилка', message: 'Помилка при завантаженні деталей скарги' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
  };

  const handleBanTargetUser = async () => {
    if (!selectedReport?.targetUserId) {
      return;
    }

    setBanning(true);
    try {
      const expiresAt = (() => {
        if (banDuration === 'permanent') {
          return undefined;
        }

        const amount = Number.parseInt(banDuration, 10);
        const date = new Date();
        date.setDate(date.getDate() + amount);
        return date.toISOString();
      })();

      await bansApi.banUser(selectedReport.targetUserId, {
        reason: BAN_REASON,
        expiresAt,
      });

      await alert({ title: 'Успіх', message: 'Користувача заблоковано' });
    } catch {
      await alert({ title: 'Помилка', message: 'Помилка при блокуванні користувача' });
    } finally {
      setBanning(false);
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenDetails(report.id)}
                    className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors"
                  >
                    Деталі
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Видалити
                  </button>
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

            <Modal isOpen={!!selectedReport} onClose={handleCloseDetails} title="Деталі скарги">
              <div className="p-6 space-y-4">
                {detailsLoading || !selectedReport ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[selectedReport.status]}`}>
                          {STATUS_LABELS[selectedReport.status]}
                        </span>
                        <span className="text-xs bg-surface-700 text-text-muted px-2 py-0.5 rounded">
                          {TARGET_LABELS[selectedReport.targetType]}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-text-primary">{selectedReport.reason}</p>
                      {selectedReport.description && (
                        <p className="mt-2 text-sm text-text-secondary whitespace-pre-line">{selectedReport.description}</p>
                      )}
                    </div>

                    <div className="grid gap-3 text-sm text-text-secondary">
                      <div>Автор: {selectedReport.reporterUsername}</div>
                      <div>ID цілі: {selectedReport.targetId}</div>
                      {selectedReport.targetUsername && (
                        <div>Користувач цілі: {selectedReport.targetUsername}</div>
                      )}
                      <div>Дата створення: {new Date(selectedReport.createdAt).toLocaleString('uk-UA')}</div>
                      {selectedReport.reviewedByUsername && (
                        <div>Розглянув: {selectedReport.reviewedByUsername}</div>
                      )}
                      {selectedReport.reviewedAt && (
                        <div>Дата розгляду: {new Date(selectedReport.reviewedAt).toLocaleString('uk-UA')}</div>
                      )}
                      {selectedReport.adminNote && (
                        <div className="rounded-lg bg-surface-700 px-3 py-2 text-text-primary">
                          Примітка адміна: {selectedReport.adminNote}
                        </div>
                      )}
                    </div>

                    {selectedReport.targetUserId && (
                      <div className="rounded-lg border border-surface-700 p-4 space-y-3">
                        <div className="text-sm font-medium text-text-primary">
                          Швидке блокування користувача
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <select
                            value={banDuration}
                            onChange={(e) => setBanDuration(e.target.value)}
                            className="w-full sm:w-48 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500 text-sm"
                          >
                            {BAN_DURATIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleBanTargetUser}
                            disabled={banning}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm transition-colors"
                          >
                            {banning ? 'Блокування...' : 'Заблокувати користувача'}
                          </button>
                        </div>
                        <p className="text-xs text-text-muted">
                          Причина буде автоматично встановлена як: {BAN_REASON}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={() => handleDeleteReport(selectedReport.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Видалити скаргу
                        </button>
                        <button
                          onClick={handleCloseDetails}
                          className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors"
                        >
                          Закрити
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Modal>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-surface-800 text-text-primary disabled:opacity-40 hover:bg-surface-700 transition-colors"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((pageNumber) => pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 1)
            .map((pageNumber, index, array) => {
              const previous = array[index - 1];
              const showEllipsis = index > 0 && previous !== undefined && pageNumber - previous > 1;

              return (
                <div key={pageNumber} className="flex items-center gap-2">
                  {showEllipsis && <span className="px-2 text-text-muted">...</span>}
                  <button
                    onClick={() => setPage(pageNumber)}
                    className={`min-w-10 rounded-lg px-3 py-2 text-sm transition-colors ${
                      page === pageNumber
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-800 text-text-primary hover:bg-surface-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                </div>
              );
            })}
          <span className="px-3 py-2 text-text-muted">{page} / {totalPages}</span>
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
