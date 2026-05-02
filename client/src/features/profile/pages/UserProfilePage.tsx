import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersApi } from '../../../core/api';
import { useAppSelector } from '../../../app/store/hooks';
import { TitleCard } from '../../catalog/components/TitleCard';
import { Pagination } from '../../catalog/components/Pagination';
import { Button } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';
import type { UserProfile } from '../../../core/types';
import type { TitleDto } from '../../../core/types/dtos';
import type { PagedResponse } from '../../../core/types';
import type { UserList } from '../../../core/types';

export const UserProfilePage = () => {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [titles, setTitles] = useState<PagedResponse<TitleDto> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<UserList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
const [listsError, setListsError] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadTitles(1);
      loadCustomLists();
      loadFriendshipStatus();
      loadPendingRequestStatus();
      loadFriendsCount();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const data = await usersApi.getProfile(userId!);
      setProfile(data);
    } catch (error) {
      setProfile(null);
      setProfileError('Не вдалося завантажити профіль користувача.');
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadCustomLists = async () => {
    try {
      setListsLoading(true);
      setListsError(null);
      const data = await usersApi.getUserCustomLists(userId!);
      setLists(data);
    } catch (e) {
      console.error('Не вдалося завантажити списки користувача:', e);
      setListsError('Не вдалося завантажити списки користувача');
      setLists([]);
    } finally {
      setListsLoading(false);
    }
  };

  const loadFriendshipStatus = async () => {
    if (!userId || !authUser || authUser.id === userId) {
      setIsFriend(false);
      return;
    }

    try {
      const status = await usersApi.getFriendshipStatus(userId);
      setIsFriend(status.isFriend);
    } catch {
      setIsFriend(false);
    }
  };

  const loadPendingRequestStatus = async () => {
    if (!userId || !authUser || authUser.id === userId) {
      setHasPendingRequest(false);
      return;
    }

    try {
      const outgoing = await usersApi.getOutgoingRequests();
      setHasPendingRequest(outgoing.some((request) => request.toUserId === userId));
    } catch {
      setHasPendingRequest(false);
    }
  };

  const loadTitles = async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await usersApi.getUserTitles(userId!, pageNum, 20);
      setTitles(data);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load titles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendsCount = async () => {
    if (!userId) return;
    try {
      const data = await usersApi.getFriendsCount(userId);
      setFriendsCount(data.count);
    } catch (error) {
      console.error('Не вдалося завантажити кількість друзів:', error);
    }
  };

  const handleAddFriend = async () => {
    if (!userId) return;

    if (!authUser) {
      alert('Увійдіть в акаунт, щоб додавати в друзі.');
      return;
    }

    if (authUser.id === userId) {
      alert('Себе не можна додати в друзі.');
      return;
    }

    try {
      setFriendActionLoading(true);
      await usersApi.sendFriendRequest(userId);
      setHasPendingRequest(true);
      alert('Запит про дружбу відправлено!');
    } catch (e) {
      console.error('Send friend request failed:', e);
      alert('Не вдалося відправити запит. Спробуйте ще раз.');
    } finally {
      setFriendActionLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-text-muted">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-surface rounded-lg p-6 border border-divider">
          <h1 className="text-2xl font-bold text-text-primary mb-3">Профіль недоступний</h1>
          <p className="text-text-secondary mb-6">
            {profileError ?? 'Не вдалося завантажити дані користувача.'}
          </p>
          <div className="flex gap-3">
            <Button onClick={loadProfile}>Спробувати ще раз</Button>
            <Link to={ROUTES.CATALOG}>
              <Button variant="secondary">До каталогу</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-surface-hover flex items-center justify-center">
              <span className="text-4xl text-text-muted">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{profile.username}</h1>
            <p className="text-text-secondary mt-1">{profile.email}</p>
            <p className="text-text-muted text-sm mt-2">
              На сайті з {new Date(profile.createdAt).toLocaleDateString('uk-UA')}
            </p>
            <Link to={ROUTES.USER_FRIENDS.replace(':userId', userId!)} className="inline-block mt-2 text-sm text-primary-500 hover:text-primary-400">
              Друзі: {friendsCount}
            </Link>
          </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Button variant="primary" onClick={() => navigate(`/messages/to/${userId}`)}>Написати повідомлення</Button>
            {authUser?.id !== userId && !isFriend && (
              <Button
                variant="primary"
                onClick={handleAddFriend}
                disabled={friendActionLoading || hasPendingRequest}
              >
                {friendActionLoading ? 'Зачекайте...' : hasPendingRequest ? 'Запит надіслано' : 'Додати в друзі'}
              </Button>
            )}
            <Link to={`/users/${userId}/reading-lists`}>
              <Button>Перейти до списків</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Списки користувача</h2>
        {listsLoading ? (
          <div className="text-text-muted">Завантаження...</div>
        ) : listsError ? (
          <div className="text-red-500">{listsError}</div>
        ) : lists.length === 0 ? (
          <div className="text-text-muted">Списків поки немає</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <Link
                key={list.id}
                to={`/user-lists/${list.id}`}
                className="p-4 bg-surface-800 rounded-lg border border-surface-700 hover:border-primary-500 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-text-primary group-hover:text-primary-500">{list.name}</h3>
                  <span className="text-xs bg-surface-700 px-2 py-0.5 rounded">{list.titlesCount ?? 0} творів</span>
                </div>
                {list.description && (
                  <p className="text-text-muted text-sm mt-2 line-clamp-1">{list.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          Опубліковані твори ({titles?.totalCount || 0})
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-text-muted">Завантаження...</p>
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
        <div className="text-center py-12">
          <p className="text-text-muted">Користувач ще не опублікував жодного твору</p>
        </div>
      )}

    </div>
  );
};
