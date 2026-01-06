import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../../../app/store/hooks';
import { axiosInstance } from '../../../core/api';
import { ReadingStatus } from '../../../core/types/enums';
import { Button, Select } from '../../../shared/components';

interface AddToListButtonProps {
  titleId: string;
  onLoginRequired: () => void;
}

const statusOptions = [
  { value: String(ReadingStatus.Reading), label: 'Читаю' },
  { value: String(ReadingStatus.Planned), label: 'Заплановано' },
  { value: String(ReadingStatus.Completed), label: 'Завершено' },
  { value: String(ReadingStatus.Dropped), label: 'Припинено' },
  { value: String(ReadingStatus.Favorite), label: 'Улюблені' },
];

const getStatusLabel = (status: ReadingStatus): string => {
  const option = statusOptions.find(opt => opt.value === String(status));
  return option?.label || 'У списку';
};

export function AddToListButton({ titleId, onLoginRequired }: AddToListButtonProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [showSelect, setShowSelect] = useState(false);
  const [status, setStatus] = useState<ReadingStatus>(ReadingStatus.Planned);
  const [currentStatus, setCurrentStatus] = useState<ReadingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkTitleStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const response = await axiosInstance.get<{ status: ReadingStatus | null }>(`/ReadingLists/${titleId}/status`);
      if (response.data.status !== null) {
        setCurrentStatus(response.data.status);
        setStatus(response.data.status);
      }
    } finally {
      setCheckingStatus(false);
    }
  }, [titleId]);

  useEffect(() => {
    if (isAuthenticated) {
      checkTitleStatus();
    }
  }, [isAuthenticated, checkTitleStatus]);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    if (!showSelect) {
      setShowSelect(true);
      return;
    }

    setLoading(true);
    try {
      if (currentStatus !== null) {
        await axiosInstance.put(`/ReadingLists/${titleId}`, { TitleId: titleId, Status: status });
      } else {
        await axiosInstance.post('/ReadingLists', { TitleId: titleId, Status: status });
      }
      setCurrentStatus(status);
      setShowSelect(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/ReadingLists/${titleId}`);
      setCurrentStatus(null);
      setShowSelect(false);
      setStatus(ReadingStatus.Planned);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Button variant="secondary" disabled>
        <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
      </Button>
    );
  }

  if (currentStatus !== null && !showSelect) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => setShowSelect(true)}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {getStatusLabel(currentStatus)}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showSelect && (
        <Select
          value={String(status)}
          onChange={(v) => setStatus(Number(v) as ReadingStatus)}
          options={statusOptions}
        />
      )}
      <Button onClick={handleAdd} loading={loading}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {showSelect ? 'Зберегти' : 'Додати до списку'}
      </Button>
      {showSelect && (
        <>
          {currentStatus !== null && (
            <Button variant="danger" onClick={handleRemove} loading={loading}>
              Видалити
            </Button>
          )}
          <Button variant="ghost" onClick={() => setShowSelect(false)}>
            Скасувати
          </Button>
        </>
      )}
    </div>
  );
}
