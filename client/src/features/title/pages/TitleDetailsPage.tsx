import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchTitleDetails } from '../store';
import { RatingButtons, ReviewList, AddToListButton, TitleCommentsList } from '../components';
import { AuthDialog, Button } from '../../../shared/components';
import { AddToCollectionButton } from '../../collections/components/AddToCollectionButton';
import { ratingsApi } from '../../../core/api';
import { teamsApi } from '../../../core/api/teams';
import { UserRole } from '../../../core/types/enums';
import type { TitleRating } from '../../../core/types';

type DiscussionTab = 'comments' | 'reviews';

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
  const [teamSubscriptions, setTeamSubscriptions] = useState<Record<string, boolean>>({});
  const [hasTeamMembership, setHasTeamMembership] = useState(false);
  const [activeDiscussionTab, setActiveDiscussionTab] = useState<DiscussionTab>('comments');

  const isPublisherOrAdmin = user && currentTitle && (
    user.id === currentTitle.publisher?.id ||
    user.role === UserRole.Administrator
  );
  const canManageChapters = isPublisherOrAdmin || hasTeamMembership;

  // Витягуємо всі унікальні команди з розділів або з бекенду
  const availableTeams = useMemo(() => {
    if (!currentTitle) return [];
    
    const teamsMap = new Map<string, { id: string; name: string }>();
    
    // Якщо бекенд щось передав
    if (currentTitle.translationTeams) {
      currentTitle.translationTeams.forEach(t => teamsMap.set(t.id, t));
    }
    
    // Додаємо команди з розділів (якщо бекенд їх забув додати в translationTeams)
    if (currentTitle.chapters) {
      currentTitle.chapters.forEach(c => {
        // У тебе в DTO є translationTeamId та translationTeamName
        if (c.translationTeamId && c.translationTeamName) {
          if (!teamsMap.has(c.translationTeamId)) {
            teamsMap.set(c.translationTeamId, { id: c.translationTeamId, name: c.translationTeamName });
          }
        }
      });
    }
    
    return Array.from(teamsMap.values());
  }, [currentTitle]);

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

  useEffect(() => {
    setSelectedTeamId(null);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadSubscriptions = async () => {
      if (!user || availableTeams.length === 0) {
        setTeamSubscriptions({});
        return;
      }

      const entries = await Promise.all(
        availableTeams.map(async (team) => {
          try {
            const subscribed = await teamsApi.isSubscribed(team.id);
            return [team.id, subscribed] as const;
          } catch {
            return [team.id, false] as const;
          }
        })
      );

      if (!cancelled) {
        setTeamSubscriptions(Object.fromEntries(entries));
      }
    };

    loadSubscriptions().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [availableTeams, user]);

  const handleTeamBellClick = async (teamId: string) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const isSubscribed = teamSubscriptions[teamId] ?? false;

    setTeamSubscriptions((prev) => ({
      ...prev,
      [teamId]: !isSubscribed,
    }));

    try {
      if (isSubscribed) {
        await teamsApi.unsubscribe(teamId);
      } else {
        await teamsApi.subscribe(teamId);
      }
    } catch {
      setTeamSubscriptions((prev) => ({
        ...prev,
        [teamId]: isSubscribed,
      }));
    }
  };

  const getTeamInitials = (teamName: string) => {
    const parts = teamName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'T';

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'T';
  };

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
    ? currentTitle.chapters.filter((c) => c.translationTeamId === selectedTeamId || !c.translationTeamId)
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
              {(() => {
                const map: Record<number, string> = {
                  0: 'Випускається',
                  1: 'Завершений',
                  2: 'Упинений',
                  3: 'Випуск припинено'
                };
                return map[currentTitle.status] ?? currentTitle.status;
              })()}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-surface-hover text-text-primary">
              {translateCountry(currentTitle.countryOfOrigin)}
            </span>
            {currentTitle.averageScore != null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {currentTitle.averageScore.toFixed(1)}
                <span className="text-text-muted font-normal text-xs">
                  / 10 ({currentTitle.reviewsCount ?? 0})
                </span>
              </span>
            )}
            <RatingButtons
              titleId={currentTitle.id}
              initialRating={rating}
              onLoginRequired={() => setShowLogin(true)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <AddToListButton
              titleId={currentTitle.id}
              onLoginRequired={() => setShowLogin(true)}
            />
            <AddToCollectionButton
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

          {/* Блок команд перекладачів з дзвіночками */}
          {availableTeams.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-text-primary mb-3">Команди перекладачів</h2>
              
              {availableTeams.length > 1 ? (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-surface to-surface-hover p-4 sm:p-5 shadow-lg shadow-black/20">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-text-primary">Доступні команди</p>
                    <p className="text-xs text-text-muted">Оберіть команду, щоб отримувати сповіщення про нові розділи саме від неї.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {availableTeams.map((team) => {
                      const isSubscribed = teamSubscriptions[team.id] ?? false;

                      return (
                        <div
                          key={team.id}
                          className={`flex items-center gap-3 rounded-xl border transition-all px-4 py-3 ${
                            selectedTeamId === team.id 
                            ? 'border-primary-500/50 bg-primary-500/5' 
                            : 'border-white/10 bg-black/20 hover:border-white/20'
                          }`}
                        >
                          <div 
                            onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-black text-white shadow-md">
                              {getTeamInitials(team.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-text-primary">{team.name}</p>
                              <p className="text-[10px] text-text-muted uppercase tracking-wider">Переклад</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamBellClick(team.id);
                            }}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                              isSubscribed
                                ? 'border-red-500/40 bg-red-500/20 text-red-400 shadow-inner'
                                : 'border-white/10 bg-white/5 text-text-muted hover:border-red-500/30 hover:text-red-400'
                            }`}
                            title={isSubscribed ? "Відписатися від оновлень команди" : "Підписатися на оновлення команди"}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSubscribed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTeams.map((team) => {
                    const isSubscribed = teamSubscriptions[team.id] ?? false;

                    return (
                      <div
                        key={team.id}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-hover px-2 py-1"
                      >
                        <Link
                          to={`/teams/${team.id}`}
                          className="inline-flex items-center px-2 py-1 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          {team.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleTeamBellClick(team.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                            isSubscribed
                              ? 'border-red-500/40 bg-red-500/15 text-red-400'
                              : 'border-white/10 bg-white/5 text-text-muted hover:border-red-500/30 hover:text-red-400'
                          }`}
                          aria-label={isSubscribed ? `Відписатися від ${team.name}` : `Підписатися на ${team.name}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isSubscribed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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

            {availableTeams.length > 1 && (
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
                {availableTeams.map((team) => (
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
                          <span className="font-medium text-text-primary">Розділ {chapter.chapterNumber}</span>
                          {chapter.name && (
                            <span className="ml-2 text-text-muted">- {chapter.name}</span>
                          )}
                          {chapter.translationTeamName && !selectedTeamId && (
                            <span className="ml-2 text-xs text-primary-400">[{chapter.translationTeamName}]</span>
                          )}
                        </div>
                        {chapter.isPremium && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
                            {chapter.price && chapter.price > 0 ? `${chapter.price.toFixed(0)} ₴` : 'Premium'}
                          </span>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Обговорення</h2>
              <div className="flex items-center gap-2 rounded-lg bg-surface-800 p-1 border border-surface-700">
                <button
                  onClick={() => setActiveDiscussionTab('comments')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeDiscussionTab === 'comments'
                      ? 'bg-primary-600 text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Коментарі
                </button>
                <button
                  onClick={() => setActiveDiscussionTab('reviews')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeDiscussionTab === 'reviews'
                      ? 'bg-primary-600 text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Рецензії
                </button>
              </div>
            </div>

            {activeDiscussionTab === 'comments' ? (
              <TitleCommentsList
                titleId={currentTitle.id}
                onLoginRequired={() => setShowLogin(true)}
              />
            ) : (
              <ReviewList
                titleId={currentTitle.id}
                onLoginRequired={() => setShowLogin(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};