import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usersApi } from '../../../core/api';
import { readingListsApi } from '../../reading-lists/api/readingListsApi';
import { Button } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';
import { ReadingStatus, type ReadingListItem, type UserList } from '../../../core/types';

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

export const UserAllListsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [readingLists, setReadingLists] = useState<ReadingListItem[]>([]);
  const [customLists, setCustomLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);

      try {
        const [readingListsData, customListsData] = await Promise.all([
          readingListsApi.getReadingListsByUser(userId),
          usersApi.getUserCustomLists(userId),
        ]);

        setReadingLists(readingListsData);
        setCustomLists(customListsData);
      } catch (e) {
        console.error('Не вдалося завантажити списки користувача:', e);
        setError('Не вдалося завантажити списки користувача');
        setReadingLists([]);
        setCustomLists([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const getCountByStatus = (status: ReadingStatus) =>
    readingLists.filter((item) => item.status === status && !item.userListId).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Усі списки користувача</h1>
          <p className="mt-1 text-text-muted">Читальні статуси та кастомні списки в одному місці</p>
        </div>
        <Link to={ROUTES.USER_PROFILE.replace(':userId', userId ?? '')}>
          <Button variant="secondary">Повернутись до профілю</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-text-muted">Завантаження списків...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Списки читання</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {READING_STATUSES.map((status) => (
                <Link
                  key={status}
                  to={`/users/${userId}/reading-lists`}
                  className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 hover:border-primary-500 transition-colors"
                >
                  <p className="text-sm text-text-muted">{READING_STATUS_LABELS[status]}</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">{getCountByStatus(status)}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Кастомні списки</h2>
            {customLists.length === 0 ? (
              <div className="text-text-muted">Кастомних списків поки немає</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customLists.map((list) => (
                  <Link
                    key={list.id}
                    to={`/user-lists/${list.id}`}
                    className="p-4 bg-surface-800 rounded-lg border border-surface-700 hover:border-primary-500 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-text-primary group-hover:text-primary-500">{list.name}</h3>
                      <span className="text-xs bg-surface-700 px-2 py-0.5 rounded">{list.titlesCount ?? 0} творів</span>
                    </div>
                    {list.description && (
                      <p className="text-text-muted text-sm mt-2 line-clamp-1">{list.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserAllListsPage;