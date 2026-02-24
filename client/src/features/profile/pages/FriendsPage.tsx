import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usersApi } from '../../../core/api';
import { useAppSelector } from '../../../app/store/hooks';
import { Button } from '../../../shared/components';
import { ROUTES } from '../../../core/constants';
import type { FriendDto, FriendRequestDto, UserProfile } from '../../../core/types';

export const FriendsPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestDto[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'outgoing'>('friends');
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actingFriendId, setActingFriendId] = useState<string | null>(null);

  const isOwnProfile = !!authUser && userId && authUser.id === userId;

  const loadData = async () => {
    if (!userId) {
      console.warn('FriendsPage: userId не встановлений');
      return;
    }
    
    console.log('FriendsPage: завантажую дані для userId:', userId);
    try {
      setLoading(true);
      const [profileData, friendsData] = await Promise.all([
        usersApi.getProfile(userId),
        usersApi.getFriends(userId),
      ]);
      console.log('FriendsPage: завантажені друзі:', friendsData);
      setProfile(profileData);
      setFriends(friendsData);

      if (isOwnProfile) {
        const [incomingData, outgoingData] = await Promise.all([
          usersApi.getIncomingRequests(),
          usersApi.getOutgoingRequests(),
        ]);
        setIncomingRequests(incomingData);
        setOutgoingRequests(outgoingData);
      }
    } catch (e) {
      console.error('Не вдалося завантажити друзів:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, isOwnProfile]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'incoming' || tab === 'outgoing' || tab === 'friends') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId, isOwnProfile]);

  const handleAccept = async (requestId: string) => {
    try {
      setActingRequestId(requestId);
      await usersApi.acceptFriendRequest(requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setFriends((prev) => {
        const request = incomingRequests.find((r) => r.id === requestId);
        if (request) {
          return [...prev, { id: request.fromUserId, username: request.fromUsername, avatarUrl: request.fromAvatarUrl }];
        }
        return prev;
      });
    } catch (e) {
      console.error('Не вдалося прийняти заявку:', e);
    } finally {
      setActingRequestId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setActingRequestId(requestId);
      await usersApi.rejectFriendRequest(requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      console.error('Не вдалося відхилити заявку:', e);
    } finally {
      setActingRequestId(null);
    }
  };

  const handleCancelOutgoing = async (requestId: string) => {
    try {
      setActingRequestId(requestId);
      await usersApi.rejectFriendRequest(requestId);
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      console.error('Не вдалося скасувати заявку:', e);
    } finally {
      setActingRequestId(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      setActingFriendId(friendId);
      await usersApi.removeFriend(friendId);
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (e) {
      console.error('Не вдалося видалити з друзів:', e);
    } finally {
      setActingFriendId(null);
    }
  };

  if (!userId) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-text-muted">Користувача не знайдено</div>;
  }

  const title = isOwnProfile ? 'Мої друзі' : `Друзі ${profile?.username ?? ''}`.trim();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            <p className="text-text-muted mt-1">Всього друзів: {friends.length}</p>
          </div>
          {profile && (
            <Link to={ROUTES.USER_PROFILE.replace(':userId', profile.id)}>
              <Button variant="ghost">Назад до профілю</Button>
            </Link>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <div className="bg-surface rounded-lg p-2 mb-6 border border-divider">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'friends' ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Список друзів
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'incoming' ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Заявки в друзі ({incomingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outgoing')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'outgoing' ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Відправлені запити ({outgoingRequests.length})
            </button>
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <>
          {loading ? (
            <div className="text-text-muted">Завантаження...</div>
          ) : friends.length === 0 ? (
            <div className="bg-surface rounded-lg p-6 text-text-muted">Список друзів порожній</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-surface rounded-lg p-4 border border-divider flex items-center justify-between gap-3"
                >
                  <Link
                    to={ROUTES.USER_PROFILE.replace(':userId', friend.id)}
                    className="flex items-center gap-3 min-w-0"
                  >
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                        <span className="text-lg text-text-muted">{friend.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{friend.username}</p>
                    </div>
                  </Link>
                  {authUser?.id !== friend.id && (
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={() => navigate(`/messages/to/${friend.id}`)}>
                        Написати
                      </Button>
                      {isOwnProfile && (
                        <Button
                          variant="danger"
                          onClick={() => handleRemoveFriend(friend.id)}
                          disabled={actingFriendId === friend.id}
                        >
                          {actingFriendId === friend.id ? '...' : 'Видалити'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'incoming' && (
        <>
          {loading ? (
            <div className="text-text-muted">Завантаження...</div>
          ) : incomingRequests.length === 0 ? (
            <div className="bg-surface rounded-lg p-6 text-text-muted">Вхідних заявок немає</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-surface rounded-lg p-4 border border-divider flex items-center justify-between gap-3"
                >
                  <Link
                    to={ROUTES.USER_PROFILE.replace(':userId', request.fromUserId)}
                    className="flex items-center gap-3 min-w-0"
                  >
                    {request.fromAvatarUrl ? (
                      <img
                        src={request.fromAvatarUrl}
                        alt={request.fromUsername}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                        <span className="text-lg text-text-muted">{request.fromUsername.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{request.fromUsername}</p>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleAccept(request.id)}
                      disabled={actingRequestId === request.id}
                    >
                      {actingRequestId === request.id ? '...' : 'Прийняти'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleReject(request.id)}
                      disabled={actingRequestId === request.id}
                    >
                      {actingRequestId === request.id ? '...' : 'Відхилити'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'outgoing' && (
        <>
          {loading ? (
            <div className="text-text-muted">Завантаження...</div>
          ) : outgoingRequests.length === 0 ? (
            <div className="bg-surface rounded-lg p-6 text-text-muted">Відправлених заявок немає</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {outgoingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-surface rounded-lg p-4 border border-divider flex items-center justify-between gap-3"
                >
                  <Link
                    to={ROUTES.USER_PROFILE.replace(':userId', request.toUserId)}
                    className="flex items-center gap-3 min-w-0"
                  >
                    {request.fromAvatarUrl ? (
                      <img
                        src={request.fromAvatarUrl}
                        alt={request.fromUsername}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                        <span className="text-lg text-text-muted">{request.fromUsername.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{request.fromUsername}</p>
                    </div>
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => handleCancelOutgoing(request.id)}
                    disabled={actingRequestId === request.id}
                  >
                    {actingRequestId === request.id ? '...' : 'Скасувати'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
