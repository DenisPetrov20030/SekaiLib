import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchTitleDetails } from '../store';
import { RatingButtons, ReviewList, AddToListButton } from '../components';
import { AuthDialog, Button } from '../../../shared/components';
import { ratingsApi } from '../../../core/api';
import { teamsApi } from '../../../core/api/teams';
import { UserRole } from '../../../core/types/enums';
import type { TitleRating } from '../../../core/types';

const translateCountry = (country: string): string => {
  const translations: { [key: string]: string } = {
    Japan: 'Японія',
    China: 'Китай',
    Korea: 'Південна Корея',
    Other: 'Інше',
  };
  return translations[country] || country;
};

export const TitleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTitle, loading, error } = useAppSelector((state) => state.title);
  const { user } = useAppSelector((state) => state.auth);
  const [showLogin, setShowLogin] = useState(false);
  const [rating, setRating] = useState<TitleRating | undefined>();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [hasTeamMembership, setHasTeamMembership] = useState(false);

  const isPublisherOrAdmin = user && currentTitle && (
    user.id === currentTitle.publisher?.id ||
    user.role === UserRole.Administrator
  );
  const canManageChapters = isPublisherOrAdmin || hasTeamMembership;

  useEffect(() => {
    if (id) {
      dispatch(fetchTitleDetails(id));
      ratingsApi.get(id).then(setRating).catch(() => {});
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (user) {
      teamsApi.getMyTeams(true)
        .then((teams) => setHasTeamMembership(teams.length > 0))
        .catch(() => {});
    } else {
      setHasTeamMembership(false);
    }
  }, [user]);

  // Reset team filter when title changes
  useEffect(() => {
    setSelectedTeamId(null);
  }, [id]);

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

  const filteredChapters = selectedTeamId
    ? currentTitle.chapters.filter((c) => c.translationTeamId === selectedTeamId)
    : currentTitle.chapters;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AuthDialog isOpen={showLogin} onClose={() => setShowLogin(false)} initialMode="login" />

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
              {translateCountry(currentTitle.countryOfOrigin)}
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

          {/* Translation teams */}
          {currentTitle.translationTeams && currentTitle.translationTeams.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-text-primary mb-2">Команди перекладачів</h2>
              <div className="flex flex-wrap gap-2">
                {currentTitle.translationTeams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-surface-hover text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    {team.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

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

            {/* Team filter */}
            {currentTitle.translationTeams && currentTitle.translationTeams.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedTeamId(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTeamId === null
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Всі переклади
                </button>
                {currentTitle.translationTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTeamId === team.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {filteredChapters.length > 0 ? (
                filteredChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 bg-surface rounded-lg shadow hover:bg-surface-hover transition-colors"
                  >
                    <Link
                      to={`/titles/${currentTitle.id}/chapters/${chapter.chapterNumber}`}
                      className="flex-1"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-text-primary">Глава {chapter.chapterNumber}</span>
                          {chapter.name && (
                            <span className="ml-2 text-text-muted">- {chapter.name}</span>
                          )}
                          {chapter.translationTeamName && !selectedTeamId && (
                            <span className="ml-2 text-xs text-primary-400">[{chapter.translationTeamName}]</span>
                          )}
                        </div>
                        {chapter.isPremium && (
                          <span className="text-xs text-yellow-500 font-medium">Premium</span>
                        )}
                      </div>
                    </Link>
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
                  {selectedTeamId ? 'Ця команда ще не додала розділів' : 'Розділи ще не додані'}
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
