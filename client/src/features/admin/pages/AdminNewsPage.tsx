import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsApi } from '../../../core/api/news';
import type { NewsItem } from '../../../core/types/entities';
import { ROUTES } from '../../../core/constants';
import { useDialog } from '../../../shared/hooks/useDialog';

export function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();

  useEffect(() => {
    newsApi.getAll(1, 50)
      .then((res) => setItems(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Видалити новину?', confirmLabel: 'Видалити', variant: 'danger' });
    if (!ok) return;
    try {
      await newsApi.delete(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      await alert({ title: 'Помилка', message: 'Не вдалося видалити' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Новини</h1>
        <button
          onClick={() => navigate(ROUTES.ADMIN_NEWS_CREATE)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          + Нова новина
        </button>
      </div>

      <div className="bg-surface-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-text-muted text-center py-8">Новин немає</p>
        ) : (
          <div className="divide-y divide-surface-700">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary truncate">{item.title}</span>
                    {!item.isPublished && (
                      <span className="text-xs bg-surface-700 text-text-muted px-2 py-0.5 rounded shrink-0">
                        Чернетка
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    {item.authorUsername} · {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(ROUTES.ADMIN_NEWS_EDIT.replace(':id', item.id))}
                    className="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg text-sm transition-colors"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
