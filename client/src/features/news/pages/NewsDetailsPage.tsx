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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={ROUTES.NEWS} className="text-primary-500 hover:text-primary-400 text-sm mb-8 inline-flex items-center gap-1 transition-colors">
        ← До новин
      </Link>

      <article className="bg-surface rounded-xl p-6 sm:p-8 border border-surface-hover/50">
        <h1 className="text-4xl font-bold text-text-primary mb-4 leading-tight">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-8 pb-6 border-b border-surface-hover/30">
          <span className="font-medium text-text-secondary">{item.authorUsername}</span>
          <span className="text-surface-hover/60">·</span>
          <span>{new Date(item.createdAt).toLocaleDateString('uk-UA', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}</span>
        </div>
        <div className="text-text-secondary whitespace-pre-wrap leading-relaxed text-base space-y-4">
          {item.content}
        </div>
      </article>
    </div>
  );
}
