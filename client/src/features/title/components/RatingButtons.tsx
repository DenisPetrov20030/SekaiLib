import { useState } from 'react';
import { useAppSelector } from '../../../app/store/hooks';
import { ReactionType } from '../../../core/types/enums';
import { ratingsApi } from '../../../core/api';
import type { TitleRating } from '../../../core/types';
import { IconButton } from '../../../shared/components';

interface RatingButtonsProps {
  titleId: string;
  initialRating?: TitleRating;
  onLoginRequired: () => void;
}

export function RatingButtons({ titleId, initialRating, onLoginRequired }: RatingButtonsProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [rating, setRating] = useState<TitleRating | undefined>(initialRating);
  const [loading, setLoading] = useState(false);

  const handleRate = async (type: ReactionType) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    setLoading(true);
    try {
      const newRating = await ratingsApi.set(titleId, { type });
      setRating(newRating);
    } finally {
      setLoading(false);
    }
  };

  const likesCount = rating?.likesCount ?? 0;
  const dislikesCount = rating?.dislikesCount ?? 0;
  const userRating = rating?.userRating;

  return (
    <div className="flex items-center gap-2">
      <IconButton
        variant="like"
        active={userRating === ReactionType.Like}
        count={likesCount}
        disabled={loading}
        onClick={() => handleRate(ReactionType.Like)}
        icon={
          <svg className="w-5 h-5" fill={userRating === ReactionType.Like ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        }
      />
      <IconButton
        variant="dislike"
        active={userRating === ReactionType.Dislike}
        count={dislikesCount}
        disabled={loading}
        onClick={() => handleRate(ReactionType.Dislike)}
        icon={
          <svg className="w-5 h-5" fill={userRating === ReactionType.Dislike ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        }
      />
    </div>
  );
}
