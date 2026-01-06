import { useState, useEffect } from 'react';
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
