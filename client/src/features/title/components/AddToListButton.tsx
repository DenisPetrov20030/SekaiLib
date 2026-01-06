import { useState } from 'react';
import { useAppSelector } from '../../../app/store/hooks';
import { axiosInstance } from '../../../core/api';
import { ReadingStatus } from '../../../core/types/enums';
import { Button, Select } from '../../../shared/components';

interface AddToListButtonProps {
  titleId: string;
  onLoginRequired: () => void;
}

const statusOptions = [
  { value: String(ReadingStatus.Planned), label: 'Planned' },
  { value: String(ReadingStatus.Reading), label: 'Reading' },
  { value: String(ReadingStatus.Completed), label: 'Completed' },
  { value: String(ReadingStatus.Dropped), label: 'Dropped' },
  { value: String(ReadingStatus.Favorite), label: 'Favorite' },
];

export function AddToListButton({ titleId, onLoginRequired }: AddToListButtonProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [showSelect, setShowSelect] = useState(false);
  const [status, setStatus] = useState<ReadingStatus>(ReadingStatus.Planned);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

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
      await axiosInstance.post('/ReadingLists', { TitleId: titleId, Status: status });
      setAdded(true);
      setShowSelect(false);
    } finally {
      setLoading(false);
    }
  };

  if (added) {
    return (
      <Button variant="secondary" disabled>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Added to List
      </Button>
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
        {showSelect ? 'Confirm' : 'Add to List'}
      </Button>
      {showSelect && (
        <Button variant="ghost" onClick={() => setShowSelect(false)}>
          Cancel
        </Button>
      )}
    </div>
  );
}
