import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { reviewsApi } from '../../../core/api';
import { ROUTES } from '../../../core/constants';
import type { Review } from '../../../core/types';
import { ReviewCard } from '../components';

export function ReviewDetailsPage() {
  const { titleId, reviewId } = useParams<{ titleId: string; reviewId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!titleId || !reviewId) return;

    setLoading(true);
    reviewsApi.getById(titleId, reviewId)
      .then((data) => setReview(data))
      .catch(() => setReview(null))
      .finally(() => setLoading(false));
  }, [titleId, reviewId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!review || !titleId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-text-muted">Рецензію не знайдено</p>
        <Link to={titleId ? ROUTES.TITLE_DETAILS.replace(':id', titleId) : ROUTES.HOME} className="mt-4 inline-block text-primary-400 hover:underline">
          ← Назад
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link
        to={ROUTES.TITLE_DETAILS.replace(':id', titleId)}
        className="inline-flex items-center gap-2 text-sm text-primary-400 transition-colors hover:text-primary-300"
      >
        ← До твору
      </Link>

      <section className="rounded-3xl border border-white/10 bg-surface-900/80 p-5 shadow-lg shadow-black/20">
        <ReviewCard
          review={review}
          titleId={titleId}
          onUpdate={setReview}
          onDelete={() => navigate(ROUTES.TITLE_DETAILS.replace(':id', titleId))}
          onLoginRequired={() => {}}
        />
      </section>
    </div>
  );
}
