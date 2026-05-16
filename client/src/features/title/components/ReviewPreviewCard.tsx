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
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          <span>{review.viewCount}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span>{commentsCount}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          <span>{review.likesCount}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
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
