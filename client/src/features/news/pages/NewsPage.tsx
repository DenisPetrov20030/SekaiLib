import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi } from '../../../core/api/news';
import type { NewsItem } from '../../../core/types/entities';
import { ROUTES } from '../../../core/constants';

export function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadNews(page);
  }, [page]);

  const loadNews = async (p: number) => {
    setLoading(true);
    try {
      const res = await newsApi.getPublished(p, 10);
      setItems(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Новини</h1>

      {items.length === 0 ? (
        <p className="text-text-muted text-center py-12">Новин поки немає</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <Link
              key={item.id}
              to={ROUTES.NEWS_DETAILS.replace(':id', item.id)}
              className="block bg-surface-800 rounded-lg p-6 hover:bg-surface-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-text-primary mb-2 hover:text-primary-400 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-text-muted text-sm line-clamp-3">
                    {item.content.replace(/<[^>]*>/g, '').slice(0, 200)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 text-sm text-text-muted">
                <span>{item.authorUsername}</span>
                <span>·</span>
                <span>{new Date(item.createdAt).toLocaleDateString('uk-UA')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-surface-800 text-text-primary disabled:opacity-40 hover:bg-surface-700 transition-colors"
          >
            ←
          </button>
          <span className="px-4 py-2 text-text-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-surface-800 text-text-primary disabled:opacity-40 hover:bg-surface-700 transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
