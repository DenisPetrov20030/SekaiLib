import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { axiosInstance } from '../../../core/api';
import { TitleCard } from '../../catalog/components/TitleCard';
import { Button } from '../../../shared/components';

export const UserListPage = () => {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance.get(`/UserLists/${id}`)
      .then(res => setList(res.data))
      .catch(() => setList(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12">Завантаження...</div>;
  if (!list) return <div className="text-center py-12">Список не знайдено</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{list.name}</h1>
        <div className="text-sm text-text-muted">{list.titlesCount || 0} творів</div>
      </div>

      {list.titles && list.titles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {list.titles.map((t: any) => (
            <TitleCard key={t.id} title={{
              id: t.id,
              name: t.name,
              author: t.author,
              coverImageUrl: t.coverImageUrl,
              description: t.description || '',
              status: t.status,
              countryOfOrigin: t.countryOfOrigin || ''
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted">У списку немає тайтлів</p>
        </div>
      )}
    </div>
  );
};

export default UserListPage;
