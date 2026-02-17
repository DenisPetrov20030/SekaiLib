import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usersApi } from '../../../core/api';
import type { UserList } from '../../../core/types';

export const UserCustomListsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await usersApi.getUserCustomLists(userId);
        setLists(data);
      } catch (e) {
        console.error('Не вдалося завантажити списки користувача:', e);
        setError('Не вдалося завантажити списки користувача');
        setLists([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Списки користувача</h1>
      </div>
      {loading ? (
        <div className="text-text-muted">Завантаження...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : lists.length === 0 ? (
        <div className="text-text-muted">Списків поки немає</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Link key={list.id} to={`/user-lists/${list.id}`} className="p-4 bg-surface-800 rounded-lg border border-surface-700 hover:border-primary-500 transition-colors group">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-text-primary group-hover:text-primary-500">{list.name}</h3>
                <span className="text-xs bg-surface-700 px-2 py-0.5 rounded">{list.titlesCount ?? 0} творів</span>
              </div>
              {list.description && <p className="text-text-muted text-sm mt-2 line-clamp-1">{list.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserCustomListsPage;
