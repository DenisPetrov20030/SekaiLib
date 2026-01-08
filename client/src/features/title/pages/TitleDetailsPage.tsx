import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchTitleDetails } from '../store';
import { RatingButtons, ReviewList, AddToListButton } from '../components';
import { LoginModal, Button } from '../../../shared/components';
import { ratingsApi } from '../../../core/api';
import { UserRole } from '../../../core/types/enums';
import type { TitleRating } from '../../../core/types';

export const TitleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTitle, loading, error } = useAppSelector((state) => state.title);
  const { user } = useAppSelector((state) => state.auth);
  const [showLogin, setShowLogin] = useState(false);
  const [rating, setRating] = useState<TitleRating | undefined>();

  const canManageChapters = user && currentTitle && (
    user.id === currentTitle.publisher?.id || 
    user.role === UserRole.Administrator
  );

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
          {error || 'Твір не знайдено'}
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
          <p className="mt-2 text-lg text-text-muted">автор: {currentTitle.author}</p>
          
          {currentTitle.publisher && (
            <Link
              to={`/users/${currentTitle.publisher.id}`}
              className="mt-2 inline-flex items-center gap-2 text-text-secondary hover:text-primary-400 transition-colors"
            >
              {currentTitle.publisher.avatarUrl && (
                <img
                  src={currentTitle.publisher.avatarUrl}
                  alt={currentTitle.publisher.username}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span>Опубліковано: {currentTitle.publisher.username}</span>
            </Link>
          )}

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
            <h2 className="text-xl font-semibold text-text-primary">Опис</h2>
            <p className="mt-2 text-text-secondary whitespace-pre-line">{currentTitle.description}</p>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-text-primary">Жанри</h2>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Розділи</h2>
              {canManageChapters && (
                <Button
                  onClick={() => navigate(`/titles/${id}/chapters/create`)}
                  size="sm"
                >
                  Додати розділ
                </Button>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {currentTitle.chapters.length > 0 ? (
                currentTitle.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 bg-surface rounded-lg shadow hover:bg-surface-hover transition-colors"
                  >
                    <a
                      href={`/titles/${currentTitle.id}/chapters/${chapter.chapterNumber}`}
                      className="flex-1"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-text-primary">Глава {chapter.chapterNumber}</span>
                          {chapter.name && (
                            <span className="ml-2 text-text-muted">- {chapter.name}</span>
                          )}
                        </div>
                        {chapter.isPremium && (
                          <span className="text-xs text-yellow-500 font-medium">Premium</span>
                        )}
                      </div>
                    </a>
                    {canManageChapters && (
                      <button
                        onClick={() => navigate(`/titles/${id}/chapters/${chapter.id}/edit`)}
                        className="ml-4 px-3 py-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        Редагувати
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-text-muted text-center py-8">
                  Розділи ще не додані
                </p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Рецензії</h2>
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
