import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../../features/auth/hooks';
import { messagesApi, notificationsApi } from '../../core/api';
import { ACCESS_TOKEN_STORAGE_KEY, API_BASE_URL, ROUTES } from '../../core/constants';
import { UserRole } from '../../core/types/enums';
import { NotificationType } from '../../core/types/dtos';
import type { NotificationDto } from '../../core/types/dtos';
import { storage } from '../../core/utils';
import { AuthDialog } from './AuthDialog';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'chapters' | 'replies' | 'personal' | 'other'>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (input: string | Date): string => {
    const t = typeof input === 'string' ? new Date(input).getTime() : input.getTime();
    const diffSec = Math.floor((currentTime - t) / 1000);
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

  const dedupeNotifications = (items: NotificationDto[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const isAdmin = user?.role === UserRole.Administrator || user?.role === UserRole.Moderator;

  useEffect(() => {
    const auth = new URLSearchParams(location.search).get('auth');
    if (!isAuthenticated && (auth === 'login' || auth === 'register')) {
      setAuthMode(auth);
      setIsLoginModalOpen(true);
    }
  }, [isAuthenticated, location.search]);

  const closeAuthDialog = () => {
    setIsLoginModalOpen(false);
    const params = new URLSearchParams(location.search);
    if (!params.has('auth')) {
      return;
    }

    params.delete('auth');
    const search = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
        hash: location.hash,
      },
      { replace: true }
    );
  };

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'chapters':
        return notifications.filter((n) => n.type === NotificationType.NewChapter);
      case 'replies':
        return notifications.filter((n) => n.type === NotificationType.CommentReply);
      case 'personal':
        return notifications.filter((n) => n.type === NotificationType.DirectMessage);
      case 'other':
        return notifications.filter(
          (n) => n.type === NotificationType.FriendRequest || n.type === NotificationType.TitleCompleted
        );
      default:
        return notifications;
    }
  }, [activeTab, notifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      connectionRef.current?.stop()?.catch(() => {});
      connectionRef.current = null;
      return;
    }

    (async () => {
      try {
        const [list, unread] = await Promise.all([
          notificationsApi.getNotifications(undefined, 200),
          notificationsApi.getUnreadCount()
        ]);
        setNotifications(dedupeNotifications(list.filter((item) => !item.isRead)));
        setUnreadCount(unread.count);
      } catch {
        setNotifications([]);
      }
    })();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const apiBase = API_BASE_URL.replace(/\/api$/, '');
    const token = storage.get<string>(ACCESS_TOKEN_STORAGE_KEY) || undefined;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBase}/hubs/notifications?userId=${user.id}`, {
        accessTokenFactory: () => token ?? ''
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on('NotificationReceived', (notification: NotificationDto) => {
      setNotifications((prev) =>
        prev.some((item) => item.id === notification.id) ? prev : [notification, ...prev]
      );
      setUnreadCount((prev) => prev + 1);
    });

    connection.start().catch(() => {});
    return () => { connection.stop().catch(() => {}); };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [isNotificationsOpen]);

  const handleMarkRead = async (notification: NotificationDto) => {
    try {
      await notificationsApi.markRead(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      if (!notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      const directMessageConversationIds = Array.from(
        new Set(
          notifications
            .filter((item) => !item.isRead && item.type === NotificationType.DirectMessage && !!item.link)
            .map((item) => {
              try {
                const url = new URL(item.link!, window.location.origin);
                return url.searchParams.get('conversationId');
              } catch {
                return null;
              }
            })
            .filter((value): value is string => !!value)
        )
      );

      if (directMessageConversationIds.length > 0) {
        await Promise.allSettled(directMessageConversationIds.map((conversationId) => messagesApi.markRead(conversationId)));
      }

      await notificationsApi.markAllRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  return (
    <>
     <header className="bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              
              <Link to={ROUTES.HOME} className="text-2xl font-bold text-primary-500">
                SekaiLib
              </Link>
              
              <nav className="flex space-x-4">
                <Link
                  to={ROUTES.CATALOG}
                  className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Каталог
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to={ROUTES.READING_LISTS}
                      className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Мої списки
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to={ROUTES.ADMIN}
                    className="text-primary-400 hover:text-primary-300 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Панель адміна
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsNotificationsOpen((prev) => !prev)}
                      className={`relative p-2 rounded-full transition-all duration-200 ${
                        isNotificationsOpen ? 'bg-red-600/20 text-red-500' : 'text-white/60 hover:text-red-500 hover:bg-white/5'
                      }`}
                      aria-label="Сповіщення"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface shadow-lg shadow-red-900/40 animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-3 w-[400px] bg-black border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] z-50 overflow-hidden backdrop-blur-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/30">
                          <span className="text-sm font-black text-white uppercase tracking-widest">Сповіщення</span>
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-tighter transition-colors"
                          >
                            Прочитати все
                          </button>
                        </div>

                        <div className="flex gap-1 px-3 py-2 bg-zinc-900/20 border-b border-white/5 overflow-x-auto scrollbar-none">
                          {(['all', 'chapters', 'replies', 'personal', 'other'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight whitespace-nowrap transition-all ${
                                activeTab === tab 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }`}
                            >
                              {tab === 'all' ? 'Всі' : tab === 'chapters' ? 'Розділи' : tab === 'replies' ? 'Відповіді' : tab === 'personal' ? 'Особисті' : 'Інше'}
                            </button>
                          ))}
                        </div>

                        <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                          {filteredNotifications.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                              </div>
                              <p className="text-xs font-medium text-white/20 uppercase tracking-widest">Порожньо</p>
                            </div>
                          ) : (
                            filteredNotifications.map((notification) => {
                              const isUnread = !notification.isRead;
                              const itemContent = (
                                <div
                                  className={`group flex gap-4 px-5 py-4 border-b border-white/5 transition-all cursor-pointer ${
                                    isUnread ? 'bg-red-600/[0.03]' : 'hover:bg-white/[0.02]'
                                  }`}
                                  onClick={() => handleMarkRead(notification)}
                                >
                                  <div className="relative shrink-0">
                                    <div className="w-11 h-15 rounded-lg bg-zinc-800 overflow-hidden border border-white/10 group-hover:border-red-500/50 transition-colors">
                                      {notification.type === NotificationType.NewChapter && notification.titleCoverImageUrl ? (
                                        <img src={notification.titleCoverImageUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                                          {notification.actorAvatarUrl ? (
                                            <img src={notification.actorAvatarUrl} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="text-sm font-bold text-white/20">{(notification.actorUsername ?? 'S')[0].toUpperCase()}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {isUnread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-black shadow-sm"></div>}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-xs font-black text-white/90 truncate uppercase tracking-tight">{notification.title}</p>
                                      <span className="text-[9px] font-bold text-white/20 uppercase whitespace-nowrap ml-2">
                                        {formatRelativeTime(notification.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-white/40 line-clamp-2 italic">
                                      {notification.type === NotificationType.DirectMessage 
                                        ? `${notification.actorUsername ?? 'Користувач'} надіслав(-ла) вам повідомлення` 
                                        : notification.message}
                                    </p>
                                  </div>
                                </div>
                              );

                              return notification.link ? (
                                <Link key={notification.id} to={notification.link} onClick={() => setIsNotificationsOpen(false)}>
                                  {itemContent}
                                </Link>
                              ) : (
                                <div key={notification.id}>{itemContent}</div>
                              );
                            })
                          )}
                        </div>

                        <div className="px-5 py-3 bg-zinc-900/30 border-t border-white/5 text-center">
                          <Link
                            to={ROUTES.NOTIFICATIONS}
                            onClick={() => setIsNotificationsOpen(false)}
                            className="text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-all"
                          >
                            Переглянути всі
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link
                    to={ROUTES.PROFILE}
                    className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {user?.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Вийти
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode('login'); setIsLoginModalOpen(true); }}
                    className="text-text-secondary hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Вхід
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setIsLoginModalOpen(true); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Реєстрація
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthDialog
        isOpen={isLoginModalOpen}
        initialMode={authMode}
        onClose={closeAuthDialog}
      />
    </>
  );
};

