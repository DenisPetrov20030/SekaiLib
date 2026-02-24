import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../../../app/store/hooks';
import { axiosInstance } from '../../../core/api';
import { ReadingStatus } from '../../../core/types/enums';
import { Button, Select } from '../../../shared/components';

interface AddToListButtonProps {
  titleId: string;
  onLoginRequired: () => void;
  alwaysVisible?: boolean;
}

interface CustomList {
  id: string;
  name: string;
}

export function AddToListButton({ titleId, onLoginRequired, alwaysVisible = false }: AddToListButtonProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [showSelect, setShowSelect] = useState(false);
  
  const [status, setStatus] = useState<string>(String(ReadingStatus.Planned));
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setCheckingStatus(true);
    try {
      const customRes = await axiosInstance.get<CustomList[]>('/UserLists');
      setCustomLists(customRes.data);

      const statusRes = await axiosInstance.get<{ status: any, userListId: any }>(`/ReadingLists/${titleId}/status`);
      if (statusRes.data) {
          const userListId = statusRes.data.userListId;
          const sysStatus = statusRes.data.status;
          if (userListId) {
            setCurrentStatus(String(userListId));
            setStatus(String(userListId));
          } else if (sysStatus !== null && sysStatus !== undefined) {
            setCurrentStatus(String(sysStatus));
            setStatus(String(sysStatus));
          } else {
            setCurrentStatus(null);
          }
      }
    } catch (err) {
      console.error("Помилка завантаження списків:", err);
    } finally {
      setCheckingStatus(false);
    }
  }, [isAuthenticated, titleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allOptions = [
    { value: String(ReadingStatus.Reading), label: '📖 Читаю' },
    { value: String(ReadingStatus.Planned), label: '⏳ Заплановано' },
    { value: String(ReadingStatus.Completed), label: '✅ Завершено' },
    { value: String(ReadingStatus.Dropped), label: '❌ Припинено' },
    { value: String(ReadingStatus.Favorite), label: '⭐ Улюблені' },
    ...customLists.map(list => ({
      value: list.id,
      label: `📃 ${list.name}`
    }))
  ];

  const getStatusLabel = (val: string): string => {
    const option = allOptions.find(opt => opt.value === val);
    return option?.label || 'Додано';
  };

  const handleAdd = async () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    if (!showSelect && !alwaysVisible) {
      setShowSelect(true);
      return;
    }

    setLoading(true);
    try {
      const isCustomList = isNaN(Number(status)); 

const payload = {
    TitleId: titleId,
    Status: isCustomList ? null : Number(status),
    UserListId: isCustomList ? status : null 
};

      if (currentStatus !== null) {
        await axiosInstance.put(`/ReadingLists/${titleId}`, payload);
      } else {
        await axiosInstance.post('/ReadingLists', payload);
      }
      
      setCurrentStatus(status);
      setShowSelect(false);
    } catch (err) {
      alert("Помилка при збереженні. Перевірте консоль.");
      console.error(err);
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
      setStatus(String(ReadingStatus.Planned));
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Button variant="secondary" disabled>
        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </Button>
    );
  }
  const shouldShowSelect = alwaysVisible || showSelect;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      {shouldShowSelect ? (
        <>
          <Select
            value={status}
            onChange={(v) => setStatus(v)}
            options={allOptions}
            className="min-w-[200px]"
          />
          <div className="flex gap-2">
            <Button onClick={handleAdd} loading={loading}>
              Зберегти
            </Button>
            {!alwaysVisible && (
              <Button variant="ghost" onClick={() => setShowSelect(false)}>
                Скасувати
              </Button>
            )}
            {currentStatus !== null && (
              <Button variant="danger" onClick={handleRemove} loading={loading}>
                Видалити
              </Button>
            )}
          </div>
        </>
      ) : (
        <Button 
          variant={currentStatus ? "secondary" : "danger"} 
          onClick={() => setShowSelect(true)}
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {currentStatus ? getStatusLabel(currentStatus) : 'Додати до списку'}
        </Button>
      )}
    </div>
  );
}
