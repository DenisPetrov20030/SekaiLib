import { useState } from 'react';
import { useAppSelector } from '../../../app/store/hooks';
import type { Review } from '../../../core/types';
import { ReactionType } from '../../../core/types/enums';
import { reviewsApi } from '../../../core/api';
import { IconButton, Button } from '../../../shared/components';
import { ReviewForm } from './ReviewForm';

interface ReviewCardProps {
  review: Review;
  titleId: string;
  onUpdate: (review: Review) => void;
  onDelete: (reviewId: string) => void;
  onLoginRequired: () => void;
}

export function ReviewCard({ review, titleId, onUpdate, onDelete, onLoginRequired }: ReviewCardProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);
  const [currentReview, setCurrentReview] = useState(review);

  const isOwner = user?.id === currentReview.userId;

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    const updated = await reviewsApi.setReaction(titleId, currentReview.id, { type });
    setCurrentReview(updated);
    onUpdate(updated);
  };

  const handleUpdate = async (content: string, rating: number) => {
    const updated = await reviewsApi.update(titleId, currentReview.id, { content, rating });
    setCurrentReview(updated);
    onUpdate(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this review?')) {
      await reviewsApi.delete(titleId, currentReview.id);
      onDelete(currentReview.id);
    }
  };

  if (editing) {
    return (
      <div className="bg-surface-800 rounded-lg p-4">
        <ReviewForm
          onSubmit={handleUpdate}
          initialContent={currentReview.content}
          initialRating={currentReview.rating}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-600 flex items-center justify-center">
            {currentReview.avatarUrl ? (
              <img
                src={currentReview.avatarUrl}
                alt={currentReview.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-lg font-medium text-text-primary">
                {currentReview.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-text-primary">{currentReview.username}</p>
            <p className="text-sm text-text-muted">
              {new Date(currentReview.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-sm font-medium">
            {currentReview.rating}/10
          </span>
          {isOwner && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="mt-4 text-text-secondary whitespace-pre-line">{currentReview.content}</p>
      <div className="mt-4 flex items-center gap-2">
        <IconButton
          variant="like"
          active={currentReview.userReaction === ReactionType.Like}
          count={currentReview.likesCount}
          onClick={() => handleReaction(ReactionType.Like)}
          icon={
            <svg className="w-4 h-4" fill={currentReview.userReaction === ReactionType.Like ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          }
        />
        <IconButton
          variant="dislike"
          active={currentReview.userReaction === ReactionType.Dislike}
          count={currentReview.dislikesCount}
          onClick={() => handleReaction(ReactionType.Dislike)}
          icon={
            <svg className="w-4 h-4" fill={currentReview.userReaction === ReactionType.Dislike ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
