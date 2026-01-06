import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchTitleDetails } from '../store';
import { RatingButtons, ReviewList, AddToListButton } from '../components';
import { LoginModal } from '../../../shared/components';
import { ratingsApi } from '../../../core/api';
import type { TitleRating } from '../../../core/types';

export const TitleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentTitle, loading, error } = useAppSelector((state) => state.title);
  const [showLogin, setShowLogin] = useState(false);
  const [rating, setRating] = useState<TitleRating | undefined>();

  useEffect(() => {
    if (id) {
      dispatch(fetchTitleDetails(id));
      ratingsApi.get(id).then(setRating).catch(() => {});
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !currentTitle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          {error || 'Title not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          {currentTitle.coverImageUrl ? (
            <img
              src={currentTitle.coverImageUrl}
              alt={currentTitle.name}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full aspect-w-2 aspect-h-3 bg-surface-hover rounded-lg"></div>
          )}
        </div>

        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold text-text-primary">{currentTitle.name}</h1>
          <p className="mt-2 text-lg text-text-muted">by {currentTitle.author}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-900 text-primary-100">
              {currentTitle.status}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-surface-hover text-text-primary">
              {currentTitle.countryOfOrigin}
            </span>
            <RatingButtons
              titleId={currentTitle.id}
              initialRating={rating}
              onLoginRequired={() => setShowLogin(true)}
            />
          </div>

          <div className="mt-4">
            <AddToListButton
              titleId={currentTitle.id}
              onLoginRequired={() => setShowLogin(true)}
            />
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-text-primary">Description</h2>
            <p className="mt-2 text-text-secondary whitespace-pre-line">{currentTitle.description}</p>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-text-primary">Genres</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {currentTitle.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-surface-hover text-text-primary"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-text-primary">Chapters</h2>
            <div className="mt-4 space-y-2">
              {currentTitle.chapters.map((chapter) => (
                <a
                  key={chapter.id}
                  href={`/titles/${currentTitle.id}/chapters/${chapter.chapterNumber}`}
                  className="block p-4 bg-surface rounded-lg shadow hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-text-primary">Chapter {chapter.chapterNumber}</span>
                      {chapter.name && (
                        <span className="ml-2 text-text-muted">- {chapter.name}</span>
                      )}
                    </div>
                    {chapter.isPremium && (
                      <span className="text-xs text-yellow-500 font-medium">Premium</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Reviews</h2>
            <ReviewList
              titleId={currentTitle.id}
              onLoginRequired={() => setShowLogin(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
