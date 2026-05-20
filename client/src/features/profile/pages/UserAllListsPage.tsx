import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usersApi } from '../../../core/api';
import { readingListsApi } from '../../reading-lists/api/readingListsApi';
import { ROUTES } from '../../../core/constants';
import { ReadingStatus, type ReadingListItem, type UserList } from '../../../core/types';

const STATUS_LABELS: Record<ReadingStatus, string> = {
  [ReadingStatus.Reading]: 'Читаю',
  [ReadingStatus.Planned]: 'Заплановано',
  [ReadingStatus.Completed]: 'Завершено',
  [ReadingStatus.Dropped]: 'Припинено',
  [ReadingStatus.Favorite]: 'Улюблені',
};

const STATUS_COLORS: Record<ReadingStatus, { bg: string; text: string; border: string; icon: string }> = {
  [ReadingStatus.Reading]:   { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  icon: '📖' },
  [ReadingStatus.Planned]:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30',   icon: '🔖' },
  [ReadingStatus.Completed]: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: '✅' },
  [ReadingStatus.Dropped]:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    icon: '⏹' },
  [ReadingStatus.Favorite]:  { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '⭐' },
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

  const totalReadingItems = readingLists.filter((i) => !i.userListId).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Списки</h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-text-muted">
              {totalReadingItems} творів у читальних списках · {customLists.length} кастомних списків
            </p>
          )}
        </div>
        <Link
          to={ROUTES.USER_PROFILE.replace(':userId', userId ?? '')}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← До профілю
        </Link>
      </div>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Читальні статуси</h2>
              <Link
                to={`/users/${userId}/reading-lists`}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Переглянути всі →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {READING_STATUSES.map((status) => {
                const count = getCountByStatus(status);
                const colors = STATUS_COLORS[status];
                return (
                  <Link
                    key={status}
                    to={`/users/${userId}/reading-lists`}
                    state={{ status }}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:scale-[1.02] ${colors.bg} ${colors.border}`}
                  >
                    <span className="text-2xl">{colors.icon}</span>
                    <span className={`text-2xl font-bold ${colors.text}`}>{count}</span>
                    <span className="text-xs text-text-muted text-center leading-tight">{STATUS_LABELS[status]}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Кастомні списки
              {customLists.length > 0 && (
                <span className="ml-2 text-sm font-normal text-text-muted">({customLists.length})</span>
              )}
            </h2>
            {customLists.length === 0 ? (
              <div className="rounded-xl border border-surface-700 bg-surface-800 px-6 py-8 text-center">
                <p className="text-text-muted text-sm">Кастомних списків немає</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customLists.map((list) => (
                  <Link
                    key={list.id}
                    to={`/user-lists/${list.id}`}
                    className="flex items-center justify-between p-4 bg-surface-800 rounded-xl border border-surface-700 hover:border-primary-500/50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <h3 className="font-medium text-text-primary group-hover:text-primary-400 transition-colors truncate">
                        {list.name}
                      </h3>
                      {list.description && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{list.description}</p>
                      )}
                    </div>
                    <span className="ml-4 shrink-0 text-xs bg-surface-700 px-2.5 py-1 rounded-full text-text-muted">
                      {list.titlesCount ?? 0} творів
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default UserAllListsPage;
