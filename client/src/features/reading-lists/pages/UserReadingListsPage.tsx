import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { readingListsApi } from '../api/readingListsApi';
import { ReadingStatus, type ReadingListItem, type UserList } from '../../../core/types';
import { usersApi } from '../../../core/api';
import { useAppSelector } from '../../../app/store/hooks';

const STATUS_LABELS: Record<ReadingStatus, string> = {
  [ReadingStatus.Reading]: 'Читаю',
  [ReadingStatus.Planned]: 'Заплановано',
  [ReadingStatus.Completed]: 'Завершено',
  [ReadingStatus.Dropped]: 'Припинено',
  [ReadingStatus.Favorite]: 'Улюблені',
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  [ReadingStatus.Reading]: 'text-green-400 border-green-500/30 bg-green-500/10',
  [ReadingStatus.Planned]: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  [ReadingStatus.Completed]: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  [ReadingStatus.Dropped]: 'text-red-400 border-red-500/30 bg-red-500/10',
  [ReadingStatus.Favorite]: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
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
  const location = useLocation();
  const locationState = location.state as { status?: ReadingStatus; username?: string } | null;
  const initialStatus = locationState?.status ?? ReadingStatus.Reading;
  const usernameFromState = locationState?.username ?? null;

  const { user: authUser } = useAppSelector((state) => state.auth);
  const isOwnProfile = authUser?.id === userId;

  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>(initialStatus);
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
        setError('Не вдалося завантажити списки читання');
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
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          {isOwnProfile
            ? 'Мої списки читання'
            : usernameFromState
              ? `Списки читання: ${usernameFromState}`
              : 'Списки читання'}
        </h1>
        <Link
          to={`/users/${userId}`}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← До профілю
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-6">
            {READING_STATUSES.map((s) => {
              const count = getCountByStatus(s);
              const isActive = selectedStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStatus(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    isActive
                      ? STATUS_COLORS[s]
                      : 'border-surface-700 text-text-muted hover:text-text-primary hover:border-surface-600'
                  }`}
                >
                  {STATUS_LABELS[s]}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/15' : 'bg-surface-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="text-red-500">{error}</p>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-text-muted">У цьому списку поки нічого немає</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <Link
                  key={item.titleId}
                  to={`/titles/${item.titleId}`}
                  className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-surface-hover/50 hover:border-primary-500/30 transition-all shadow hover:shadow-primary-500/10"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-surface-hover">
                    {item.title.coverImageUrl ? (
                      <img
                        src={item.title.coverImageUrl}
                        alt={item.title.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-text-muted text-xs">Немає обкладинки</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary-400 line-clamp-2 leading-snug transition-colors">
                      {item.title.name}
                    </h3>
                    {item.title.author && (
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{item.title.author}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

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
