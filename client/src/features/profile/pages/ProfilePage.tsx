import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { usersApi, messagesApi } from '../../../core/api';
import { TitleCard } from '../../catalog/components/TitleCard';
import { Pagination } from '../../catalog/components/Pagination';
import { Button } from '../../../shared/components';
import { useDialog } from '../../../shared/hooks/useDialog';
import { ROUTES } from '../../../core/constants';
import type { TitleDto } from '../../../core/types/dtos';
import type { PagedResponse, UserProfile } from '../../../core/types';
import { Gender } from '../../../core/types';
import { fetchProfile } from '../store/profileSlice';
import { getCurrentUser } from '../../auth/store/authSlice';

export const ProfilePage = () => {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { alert } = useDialog();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [titles, setTitles] = useState<PagedResponse<TitleDto> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Array<any>>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  useEffect(() => {
    loadProfile();
    loadConversations();
  }, []);

  useEffect(() => {
    if (authUser?.id) {
      loadTitles(1);
    } else {
      setLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (authUser?.id) {
      loadFriendsCount();
    }
  }, [authUser?.id]);

  const loadFriendsCount = async () => {
    if (!authUser?.id) return;
    try {
      const data = await usersApi.getFriendsCount(authUser.id);
      setFriendsCount(data.count);
    } catch (error) {
      console.error('Не вдалося завантажити кількість друзів:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const data = await usersApi.getCurrentProfile();
      setProfile(data);
    } catch (error) {
      setProfile(null);
      setProfileError('Не вдалося завантажити профіль. Спробуйте ще раз.');
      console.error('Не вдалося завантажити профіль:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      setConvLoading(true);
      const data = await messagesApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Не вдалося завантажити переписки:', error);
    } finally {
      setConvLoading(false);
    }
  };

  const loadTitles = async (pageNum: number) => {
    if (!authUser?.id) return;
    
    try {
      setLoading(true);
      const data = await usersApi.getUserTitles(authUser.id, pageNum, 20);
      setTitles(data);
      setPage(pageNum);
    } catch (error) {
      console.error('Не вдалося завантажити назви:', error);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-divider">
          <h1 className="text-2xl font-bold text-text-primary mb-3">Профіль недоступний</h1>
          <p className="text-text-secondary mb-6">
            {profileError ?? 'Не вдалося завантажити дані профілю.'}
          </p>
          <div className="flex gap-3">
            <Button onClick={loadProfile}>Спробувати ще раз</Button>
            <Link to={`${ROUTES.CATALOG}?auth=login`}>
              <Button variant="secondary">Увійти знову</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getLocalizedRegistrationDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date).replace(' р.', '');
  };

  const getSenderName = (c: any) => {
    if (authUser?.id && c?.lastMessageSenderId === authUser.id) return authUser.username;
    return c?.otherUsername || 'Невідомо';
  };

  const getGenderText = (gender: Gender) => {
    switch (gender) {
      case Gender.Male: return 'Чоловік';
      case Gender.Female: return 'Жінка';
      default: return null;
    }
  };

  const hasExtraInfo = profile.aboutMe || getGenderText(profile.gender);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-surface rounded-lg p-6 mb-8 shadow-sm">
        
        {/* Головний контейнер: Ліва частина (інфа) + Права частина (кнопки) */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">

          {/* ЛІВА ЧАСТИНА */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full md:w-2/3">

            {/* 1. Колонка Аватарки + Додаткової інформації */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              
              <div className="relative group mt-1">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-primary-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-surface-hover flex items-center justify-center border-2 border-dashed border-text-muted">
                    <span className="text-4xl text-text-muted">
                      {profile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Кнопка завантаження аватарки */}
                {authUser?.id === profile.id && (
                  <>
                    <button
                      type="button"
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow hover:bg-primary-500 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
                      onClick={() => document.getElementById(`avatar-input-${avatarInputKey}`)?.click()}
                      title="Завантажити аватар"
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : (
                        <span className="text-2xl leading-none">+</span>
                      )}
                    </button>
                    <input
                      id={`avatar-input-${avatarInputKey}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setAvatarUploading(true);
                          const res = await usersApi.uploadAvatar(file);
                          setProfile((p) => p ? { ...p, avatarUrl: res.avatarUrl } : p);
                          dispatch(fetchProfile());
                          dispatch(getCurrentUser());
                        } catch (err) {
                          await alert({ title: 'Помилка', message: 'Не вдалося завантажити аватар. Спробуйте інший файл.' });
                          console.error(err);
                        } finally {
                          setAvatarUploading(false);
                          setAvatarInputKey((k) => k + 1);
                        }
                      }}
                    />
                  </>
                )}
              </div>

              {/* Додаткова інфа під аватаркою */}
              {hasExtraInfo && (
                <div className="flex flex-col items-center text-center gap-3 w-full max-w-[140px] break-words">
                  {getGenderText(profile.gender) && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1 font-semibold">Стать</p>
                      <p className="text-sm text-text-primary">{getGenderText(profile.gender)}</p>
                    </div>
                  )}
                  {profile.aboutMe && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1 font-semibold">Про себе</p>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                        {profile.aboutMe}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* 2. Основні дані (Нікнейм, дата) */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary truncate">{profile.username}</h1>
              <p className="text-text-secondary mt-1 truncate">{profile.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                <p className="text-text-muted text-sm">
                  На сайті з {getLocalizedRegistrationDate(profile.createdAt)}
                </p>
                {authUser?.id && (
                  <Link to={ROUTES.USER_FRIENDS.replace(':userId', authUser.id)} className="text-sm text-primary-500 hover:text-primary-400 font-medium">
                    Друзі: {friendsCount}
                  </Link>
                )}
              </div>
            </div>

          </div>
          
          {/* ПРАВА ЧАСТИНА (Кнопки) */}
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            <Link to={ROUTES.PROFILE_SETTINGS} className="w-full md:w-auto">
              <Button variant="secondary" className="w-full">Налаштування профілю</Button>
            </Link>
            <Link to={ROUTES.TITLE_CREATE} className="w-full md:w-auto">
              <Button variant="secondary" className="w-full">Опублікувати твір</Button>
            </Link>
          </div>
          
        </div>
      </div>

      {/* Особисті переписки */}
      <div className="mb-12 bg-surface rounded-lg p-6 shadow-sm border border-divider/40">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Особисті переписки</h2>
          <Button variant="ghost" onClick={loadConversations} size="sm">Оновити</Button>
        </div>
        {(() => {
          const sorted = [...conversations];
          sorted.sort((a, b) => new Date(a?.lastMessageAt || 0).getTime() - new Date(b?.lastMessageAt || 0).getTime());
          const names = Array.from(new Set(sorted.map((c) => getSenderName(c))));
          const first = names[0];
          const others = Math.max(0, names.length - 1);
          return others > 0 ? (
            <div className="text-text-secondary mb-4 text-sm">{first} та ще {others} людей</div>
          ) : null;
        })()}
        {convLoading ? (
          <div className="text-text-muted text-sm">Завантаження...</div>
        ) : conversations.length === 0 ? (
          <div className="text-text-muted text-sm bg-surface-hover/30 p-4 rounded-lg text-center">Переписок поки немає</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {conversations.map((c) => (
              <Link
                key={c.id}
                to={`/messages?conversationId=${c.id}`}
                className="block rounded-lg bg-surface-hover border border-transparent hover:border-primary-500/50 hover:bg-surface-hover/80 transition-all"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-divider shrink-0">
                    {c.otherAvatarUrl ? (
                      <img src={c.otherAvatarUrl} alt={c.otherUsername} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-text-muted">{(c.otherUsername || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 relative pr-12">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-text-primary truncate text-sm">{c.otherUsername}</span>
                    </div>
                    <div className="text-xs text-text-secondary truncate pr-4">
                      {c.lastMessageText || 'Немає повідомлень'}
                    </div>
                    
                    {c.unreadCount > 0 && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-sm">
                        {c.unreadCount > 10 ? '9+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          Мої твори <span className="text-lg font-normal text-text-muted ml-2">({titles?.totalCount || 0})</span>
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-text-muted mt-2">Завантаження творів...</p>
        </div>
      ) : titles && titles.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {titles.data.map((title) => (
              <TitleCard 
                key={title.id} 
                title={{
                  ...title,
                  countryOfOrigin: title.countryOfOrigin || '',
                }} 
              />
            ))}
          </div>

          {titles.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={titles.totalPages}
              onPageChange={loadTitles}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-surface rounded-lg shadow-sm border border-divider/40">
          <p className="text-text-muted mb-4">Ви ще не опублікували жодного твору</p>
          <Link to={ROUTES.TITLE_CREATE}>
            <Button>Опублікувати перший твір</Button>
          </Link>
        </div>
      )}
    </div>
  );
};