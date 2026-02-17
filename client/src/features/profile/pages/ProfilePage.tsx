import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { usersApi, messagesApi } from '../../../core/api';
import { TitleCard } from '../../catalog/components/TitleCard';
import { Pagination } from '../../catalog/components/Pagination';
import { Button, Modal } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';
import type { TitleDto } from '../../../core/types/dtos';
import type { PagedResponse, UserList, UserProfile } from '../../../core/types';
import { fetchProfile } from '../store/profileSlice';
import { getCurrentUser } from '../../auth/store/authSlice';

export const ProfilePage = () => {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [titles, setTitles] = useState<PagedResponse<TitleDto> | null>(null);
  const [customLists, setCustomLists] = useState<UserList[]>([]); 
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Array<any>>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarInputKey, setAvatarInputKey] = useState(0);

  useEffect(() => {
    loadProfile();
    loadTitles(1);
    loadCustomLists();
    loadConversations();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await usersApi.getCurrentProfile();
      setProfile(data);
    } catch (error) {
      console.error('Не вдалося завантажити профіль:', error);
    }
  };

  const loadCustomLists = async () => {
    try {
      const data = await usersApi.getCustomLists();
      setCustomLists(data);
    } catch (error) {
      console.error('Не вдалося завантажити кастомні списки:', error);
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

  const handleCreateList = async () => {
    setIsCreateModalOpen(true);
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  const submitCreateList = async () => {
    if (customLists.length >= 5) {
      alert('Ви досягли ліміту: можна створити не більше 5 кастомних списків.');
      return;
    }
    const name = newListName?.trim();
    if (!name) return;
    try {
      await usersApi.createCustomList(name);
      setIsCreateModalOpen(false);
      setNewListName('');
      await loadCustomLists();
    } catch (error) {
      console.error('Помилка при створенні списку:', error);
      alert('Не вдалося створити список. Можливо, назва занадто довга або виникла помилка на сервері.');
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

  // Автор останнього повідомлення у переписці
  const getSenderName = (c: any) => {
    if (authUser?.id && c?.lastMessageSenderId === authUser.id) return authUser.username;
    return c?.otherUsername || 'Невідомо';
  };

  // Аватар автора останнього повідомлення
  // (unused) getSenderAvatar removed to avoid lint warning

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-surface rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
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
              {/* Plus button to upload avatar (only for own profile) */}
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
                        alert('Не вдалося завантажити аватар. Спробуйте інший файл.');
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
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{profile.username}</h1>
              <p className="text-text-secondary mt-1">{profile.email}</p>
              <p className="text-text-muted text-sm mt-2">
                На сайті з {getLocalizedRegistrationDate(profile.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Link to={ROUTES.TITLE_CREATE}>
              <Button variant="secondary">Опублікувати твір</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Особисті переписки */}
      <div className="mb-12 bg-surface rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Особисті</h2>
          <Button variant="ghost" onClick={loadConversations}>Оновити</Button>
        </div>
        {(() => {
          const sorted = [...conversations];
          sorted.sort((a, b) => new Date(a?.lastMessageAt || 0).getTime() - new Date(b?.lastMessageAt || 0).getTime());
          const names = Array.from(new Set(sorted.map((c) => getSenderName(c))));
          const first = names[0];
          const others = Math.max(0, names.length - 1);
          return others > 0 ? (
            <div className="text-text-secondary mb-4">{first} та ще {others} людей</div>
          ) : null;
        })()}
        {convLoading ? (
          <div className="text-text-muted">Завантаження...</div>
        ) : conversations.length === 0 ? (
          <div className="text-text-muted">Переписок поки немає</div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {conversations.map((c) => (
              <Link
                key={c.id}
                to={`/messages?conversationId=${c.id}`}
                className="block rounded-lg bg-surface-hover border border-divider hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center overflow-hidden">
                    {c.otherAvatarUrl ? (
                      <img src={c.otherAvatarUrl} alt={c.otherUsername} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-text-muted">{(c.otherUsername || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 relative pr-16">
                    {c.unreadCount > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white text-base font-bold shadow-sm">
                        {c.unreadCount > 10 ? '9+' : c.unreadCount}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary truncate">{c.otherUsername}</span>
                    </div>
                    <div className="text-sm text-text-secondary truncate">
                      {c.lastMessageText || 'Немає повідомлень'}
                    </div>
                  </div>
                  {/* Removed extra unread badge; count shown at right */}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="mb-12 bg-surface rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            Мої списки <span className="text-lg font-normal text-text-muted ml-2">({customLists.length}/5)</span>
          </h2>
          {customLists.length < 5 && (
            <Button onClick={handleCreateList} className="text-sm">
              + Створити список
            </Button>
          )}
        </div>

        {customLists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customLists.map((list) => (
              <Link key={list.id} to={`/user-lists/${list.id}`} className="p-4 bg-surface-hover rounded-lg border border-divider hover:border-primary-500 transition-colors group">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-text-primary group-hover:text-primary-500">{list.name}</h3>
                  <span className="text-xs bg-surface p-1 rounded border border-divider">
                    {list.titlesCount || 0} творів
                  </span>
                </div>
                <p className="text-text-muted text-sm mt-2 line-clamp-1">
                  {list.description || 'Немає опису'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-divider rounded-lg">
            <p className="text-text-muted">У вас ще немає кастомних списків</p>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Створити новий список">
        <div>
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Назва списку"
            className="w-full p-2 border rounded mb-4 bg-surface-800"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Скасувати</Button>
            <Button onClick={submitCreateList}>Створити</Button>
          </div>
        </div>
      </Modal>

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
        <div className="text-center py-12 bg-surface rounded-lg shadow-sm">
          <p className="text-text-muted mb-4">Ви ще не опублікували жодного твору</p>
          <Link to={ROUTES.TITLE_CREATE}>
            <Button>Опублікувати перший твір</Button>
          </Link>
        </div>
      )}
    </div>
  );
};
