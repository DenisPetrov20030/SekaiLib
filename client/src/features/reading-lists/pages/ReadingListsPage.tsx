import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchReadingLists } from '../store';
import { ReadingStatus } from '../../../core/types';

const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  [ReadingStatus.Reading]: 'Читаю',
  [ReadingStatus.Planned]: 'Заплановано',
  [ReadingStatus.Completed]: 'Завершено',
  [ReadingStatus.Dropped]: 'Припинено',
  [ReadingStatus.Favorite]: 'Улюблені',
};

const READING_STATUSES = [
  ReadingStatus.Reading,
  ReadingStatus.Planned,
  ReadingStatus.Completed,
  ReadingStatus.Dropped,
  ReadingStatus.Favorite,
] as const;

export const ReadingListsPage = () => {
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>(ReadingStatus.Reading);
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.readingLists);

  useEffect(() => {
    dispatch(fetchReadingLists());
  }, [dispatch]);

  // Показуємо тільки системні записи (без userListId) у вкладках статусів
  const filteredItems = items.filter((item) => item.status === selectedStatus && !item.userListId);

  const getCountByStatus = (s: ReadingStatus) => {
    return items.filter((item) => item.status === s && !item.userListId).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Мої списки читання</h1>

      <div className="mb-6 flex gap-4 border-b border-surface-hover">
        {READING_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelectedStatus(s)}
            className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
              selectedStatus === s
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {READING_STATUS_LABELS[s]} ({getCountByStatus(s)})
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">У цьому списку немає творів</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <a
              key={item.titleId}
              href={`/titles/${item.titleId}`}
              className="block bg-surface rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-w-2 aspect-h-3 bg-surface-hover">
                {item.title.coverImageUrl ? (
                  <img
                    src={item.title.coverImageUrl}
                    alt={item.title.name}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-surface-hover">
                    <span className="text-text-muted">Без обкладинки</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
                  {item.title.name}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">{item.title.author}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
