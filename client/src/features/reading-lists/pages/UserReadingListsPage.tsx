import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { readingListsApi } from '../api/readingListsApi';
import { ReadingStatus, type ReadingListItem, type UserList } from '../../../core/types';
import { Button } from '../../../shared/components';
import { usersApi } from '../../../core/api';

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

export const UserReadingListsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>(ReadingStatus.Reading);
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [customLists, setCustomLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const [readingData, customListsData] = await Promise.all([
          readingListsApi.getReadingListsByUser(userId),
          usersApi.getUserCustomLists(userId),
        ]);
        setItems(readingData);
        setCustomLists(customListsData);
      } catch (e) {
        console.error('Не вдалося завантажити списки читання користувача:', e);
        setError('Не вдалося завантажити списки читання користувача');
        setItems([]);
        setCustomLists([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const filteredItems = items.filter((item) => item.status === selectedStatus && !item.userListId);
  const getCountByStatus = (s: ReadingStatus) => items.filter((i) => i.status === s && !i.userListId).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">Списки читання користувача</h1>
        <Link to={`/users/${userId}`}>
          <Button variant="danger" size="md">Повернутись до профілю</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - Reading lists */}
        <div className="lg:col-span-2">
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

          {error ? (
            <div className="text-red-500">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted">У цьому списку немає творів</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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

        {/* Right side - Custom lists */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-text-primary mb-4">Кастомні списки</h2>
          {customLists.length === 0 ? (
            <div className="bg-surface-800 rounded-lg p-4">
              <p className="text-text-muted text-sm">Кастомних списків немає</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/user-lists/${list.id}`}
                  className="block p-4 bg-surface-800 rounded-lg border border-surface-700 hover:border-primary-500 transition-colors group"
                >
                  <h3 className="font-medium text-text-primary group-hover:text-primary-500 transition-colors truncate">
                    {list.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    {list.titlesCount} {list.titlesCount === 1 ? 'твір' : 'творів'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReadingListsPage;
