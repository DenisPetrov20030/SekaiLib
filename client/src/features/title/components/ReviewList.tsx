import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import type { Review } from '../../../core/types';
import { reviewsApi } from '../../../core/api';
import { ReviewPreviewCard } from './ReviewPreviewCard.tsx';
import { ReviewForm } from './ReviewForm';

interface ReviewListProps {
  titleId: string;
  onLoginRequired: () => void;
}

type ReviewCategory = 'all' | 'positive' | 'neutral' | 'negative';
type ReviewSort = 'newest' | 'oldest' | 'popular' | 'rating';

const categoryLabels: Record<ReviewCategory, string> = {
  all: 'Усі',
  positive: 'Позитивні',
  neutral: 'Нейтральні',
  negative: 'Негативні',
};

const sortLabels: Record<ReviewSort, string> = {
  newest: 'Нові',
  oldest: 'Старі',
  popular: 'Популярні',
  rating: 'За оцінкою',
};

const getReviewCategory = (review: Review): Exclude<ReviewCategory, 'all'> => {
  if (review.rating >= 7) return 'positive';
  if (review.rating >= 4) return 'neutral';
  return 'negative';
};

const getPopularityScore = (review: Review) => (review.likesCount ?? 0) - (review.dislikesCount ?? 0);

export function ReviewList({ titleId, onLoginRequired }: ReviewListProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ReviewCategory>('all');
  const [sortBy, setSortBy] = useState<ReviewSort>('newest');

  const userHasReview = reviews.some((r) => r.userId === user?.id);

  const categoryCounts = useMemo(() => {
    const counts = reviews.reduce(
      (acc, review) => {
        acc.all += 1;
        acc[getReviewCategory(review)] += 1;
        return acc;
      },
      { all: 0, positive: 0, neutral: 0, negative: 0 } as Record<ReviewCategory, number>
    );

    return counts;
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? reviews
      : reviews.filter((review) => getReviewCategory(review) === selectedCategory);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return +new Date(a.createdAt) - +new Date(b.createdAt);
        case 'popular':
          return getPopularityScore(b) - getPopularityScore(a);
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
        default:
          return +new Date(b.createdAt) - +new Date(a.createdAt);
      }
    });
  }, [reviews, selectedCategory, sortBy]);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await reviewsApi.getByTitle(titleId);
        setReviews(data);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [titleId]);

  useEffect(() => {
    if (loading || reviews.length === 0) return;

    const hash = location.hash;
    if (hash && hash.startsWith('#comment-')) {
      const scrollToComment = () => {
        const element = document.querySelector(hash);
        if (element) {
          requestAnimationFrame(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            element.classList.add('ring-2', 'ring-orange-500', 'bg-orange-500/10');

            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-orange-500', 'bg-orange-500/10');
            }, 3000);
          });
          return true;
        }
        return false;
      };

      let found = false;
      const timeouts: number[] = [];

      [100, 300, 700, 1500, 3000].forEach((delay) => {
        const timeoutId = window.setTimeout(() => {
          if (!found) found = scrollToComment();
        }, delay);
        timeouts.push(timeoutId);
      });

      return () => timeouts.forEach(clearTimeout);
    }
  }, [loading, reviews, location.hash]);

  const handleCreate = async (title: string, content: string, rating: number) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    const newReview = await reviewsApi.create(titleId, { title, content, rating });
    setReviews([newReview, ...reviews]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryLabels) as ReviewCategory[]).map((category) => {
              const isActive = selectedCategory === category;
              const count = categoryCounts[category];

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary-500/40 bg-primary-500/15 text-primary-300'
                      : 'border-white/10 bg-black/20 text-text-muted hover:border-white/20 hover:text-text-primary'
                  }`}
                >
                  <span>{categoryLabels[category]}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-primary-500/20 text-primary-200' : 'bg-white/5 text-text-muted'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.25em] text-text-muted">Сортування</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ReviewSort)}
                className="appearance-none rounded-full border border-white/10 bg-black/30 px-4 py-2 pr-10 text-sm text-text-primary outline-none transition-colors focus:border-primary-500"
              >
                {(Object.keys(sortLabels) as ReviewSort[]).map((option) => (
                  <option key={option} value={option}>
                    {sortLabels[option]}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {isAuthenticated && !userHasReview && (
        <div className="bg-surface-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-text-primary mb-4">Напишіть рецензію</h3>
          <ReviewForm onSubmit={handleCreate} />
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="bg-surface-800 rounded-lg p-4 text-center">
          <p className="text-text-secondary">
            <button onClick={onLoginRequired} className="text-primary-500 hover:underline">
              Увійдіть
            </button>{' '}
            щоб написати рецензію
          </p>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-center text-text-muted py-8">Рецензій ще немає</p>
      ) : visibleReviews.length === 0 ? (
        <p className="text-center text-text-muted py-8">У цій категорії рецензій немає</p>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <ReviewPreviewCard
              key={review.id}
              review={review}
              titleId={titleId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
