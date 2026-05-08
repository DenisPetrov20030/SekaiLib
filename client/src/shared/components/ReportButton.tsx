import { useState } from 'react';
import { Modal } from './Modal';
import { reportsApi } from '../../core/api/reports';
import { ReportTargetType } from '../../core/types/enums';
import { useAppSelector } from '../../app/store/hooks';

const REASONS = [
  'Спам',
  'Образливий контент',
  'Домагання',
  'Неприйнятний вміст',
  'Порушення правил',
  'Інше',
];

const TARGET_NAMES: Record<ReportTargetType, string> = {
  [ReportTargetType.User]: 'користувача',
  [ReportTargetType.Review]: 'рецензію',
  [ReportTargetType.ReviewComment]: 'коментар',
  [ReportTargetType.ChapterComment]: 'коментар',
  [ReportTargetType.Title]: 'твір',
};

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  className?: string;
}

export function ReportButton({ targetType, targetId, className }: ReportButtonProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportsApi.create({ targetType, targetId, reason, description: description || undefined });
      setDone(true);
    } catch {
      alert('Помилка при відправці скарги');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setDone(false);
    setReason(REASONS[0]);
    setDescription('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'text-text-muted hover:text-red-400 transition-colors text-sm flex items-center gap-1'}
        title={`Поскаржитися на ${TARGET_NAMES[targetType]}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        <span>Поскаржитися</span>
      </button>

      <Modal isOpen={open} onClose={handleClose} title={`Скарга на ${TARGET_NAMES[targetType]}`}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-primary font-medium mb-1">Скаргу надіслано</p>
            <p className="text-text-muted text-sm">Модератори розглянуть її найближчим часом</p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors"
            >
              Закрити
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Причина</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Додатковий опис (необов'язково)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500 resize-none"
                placeholder="Опишіть проблему докладніше..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Надсилання...' : 'Надіслати'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg transition-colors"
              >
                Скасувати
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
