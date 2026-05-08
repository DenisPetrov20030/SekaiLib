import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsApi } from '../../../core/api/news';
import type { NewsItem } from '../../../core/types/entities';
import { ROUTES } from '../../../core/constants';

export function NewsDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    newsApi.getById(id)
      .then((res) => setItem(res.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-text-muted">Новину не знайдено</p>
        <Link to={ROUTES.NEWS} className="text-primary-400 hover:underline mt-4 inline-block">
          ← До новин
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={ROUTES.NEWS} className="text-primary-400 hover:underline text-sm mb-6 inline-block">
        ← До новин
      </Link>

      <article className="bg-surface-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">{item.title}</h1>
        <div className="flex items-center gap-3 text-sm text-text-muted mb-8 pb-6 border-b border-surface-700">
          <span>{item.authorUsername}</span>
          <span>·</span>
          <span>{new Date(item.createdAt).toLocaleDateString('uk-UA', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}</span>
        </div>
        <div className="prose prose-invert max-w-none text-text-secondary whitespace-pre-wrap leading-relaxed">
          {item.content}
        </div>
      </article>
    </div>
  );
}
