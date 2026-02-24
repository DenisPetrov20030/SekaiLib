import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks';
import type { Review } from '../../../core/types';
import { reviewsApi } from '../../../core/api';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';

interface ReviewListProps {
  titleId: string;
  onLoginRequired: () => void;
}

export function ReviewList({ titleId, onLoginRequired }: ReviewListProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const userHasReview = reviews.some((r) => r.userId === user?.id);

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

  const handleCreate = async (content: string, rating: number) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    const newReview = await reviewsApi.create(titleId, { content, rating });
    setReviews([newReview, ...reviews]);
  };

  const handleUpdate = (updated: Review) => {
    setReviews(reviews.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDelete = (reviewId: string) => {
    setReviews(reviews.filter((r) => r.id !== reviewId));
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
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              titleId={titleId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onLoginRequired={onLoginRequired}
            />
          ))}
        </div>
      )}
    </div>
  );
}
