import { Link } from 'react-router-dom';
import { ROUTES } from '../../../core/constants';
import type { Review } from '../../../core/types';

interface ReviewPreviewCardProps {
  review: Review;
  titleId: string;
}

const countComments = (items?: Review['comments']): number => {
  if (!items?.length) return 0;

  return items.filter((comment) => comment.parentCommentId == null).length;
};

const formatRelativeTime = (input: string | Date): string => {
  const now = Date.now();
  const time = typeof input === 'string' ? new Date(input).getTime() : input.getTime();
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 60) return 'щойно';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} хв тому`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} год тому`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} дн тому`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} міс тому`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} р тому`;
};

export function ReviewPreviewCard({ review, titleId }: ReviewPreviewCardProps) {
  const commentsCount = review.commentsCount ?? countComments(review.comments);
  const displayTitle = review.title?.trim() || review.content.slice(0, 120).trim() || 'Рецензія';
  const snippet = review.content.length > 320 ? `${review.content.slice(0, 320).trim()}...` : review.content;

  return (
    <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-surface-900 via-surface-800 to-black p-5 shadow-lg shadow-black/30 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link to={`/users/${review.userId}`} className="font-medium text-text-primary hover:text-primary-400 transition-colors">
              {review.username}
            </Link>
            <span>·</span>
            <span>{formatRelativeTime(review.createdAt)}</span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-text-primary line-clamp-2">
            {displayTitle}
          </h3>
        </div>
        <div className="shrink-0 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-sm font-semibold text-primary-300">
          {review.rating}/10
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-text-secondary line-clamp-4">
        {snippet}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
          <span>👁</span>
          <span>{review.viewCount}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
          <span>💬</span>
          <span>{commentsCount}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
          <span>👍</span>
          <span>{review.likesCount}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
          <span>👎</span>
          <span>{review.dislikesCount}</span>
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="rounded-full bg-primary-500/10 px-3 py-1 text-primary-300">
            {review.reviewerScore > 0 ? `+${review.reviewerScore}` : review.reviewerScore}
          </span>
          <span>Оцінка рецензента</span>
        </div>
        <Link
          to={ROUTES.REVIEW_DETAILS.replace(':titleId', titleId).replace(':reviewId', review.id)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-300 transition-colors hover:text-primary-200"
        >
          <span>Читати повністю</span>
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}
