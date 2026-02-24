import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../../../core/api';
import { NotificationType } from '../../../core/types/dtos';
import type { NotificationDto } from '../../../core/types/dtos';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'chapters' | 'replies' | 'personal' | 'other'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const allNotifications = await notificationsApi.getNotifications(undefined, 1000);
        setNotifications(allNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case 'chapters':
        return n.type === NotificationType.NewChapter;
      case 'replies':
        return n.type === NotificationType.CommentReply;
      case 'personal':
        return n.type === NotificationType.DirectMessage;
      case 'other':
        return n.type === NotificationType.FriendRequest || n.type === NotificationType.TitleCompleted;
      default:
        return true;
    }
  });

  const handleMarkRead = async (notification: NotificationDto) => {
    if (notification.isRead) return;
    
    try {
      await notificationsApi.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const diffInMs = currentTime - date.getTime();
    const diffSec = Math.floor(diffInMs / 1000);

    if (diffSec < 60) {
      return 'Щойно';
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin} хв тому`;
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return `${diffHours} год тому`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays} дн тому`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} міс тому`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} р тому`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Сповіщення</h1>
        <p className="text-text-muted">Усі ваші сповіщення за весь час</p>
      </div>

      {/* Таби для фільтрації */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'chapters', 'replies', 'personal', 'other'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-surface-hover text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            {tab === 'all'
              ? 'Все'
              : tab === 'chapters'
              ? 'Розділи'
              : tab === 'replies'
              ? 'Відповіді'
              : tab === 'personal'
              ? 'Особисті'
              : 'Інше'}
          </button>
        ))}
      </div>

      {/* Список сповіщень */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-text-muted">Завантаження...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-text-muted opacity-50 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-text-muted">Сповіщень немає</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const content = (
              <div
                onClick={() => handleMarkRead(notification)}
                className={`flex gap-4 p-4 bg-surface rounded-lg border transition-all cursor-pointer ${
                  !notification.isRead
                    ? 'border-red-600/30 bg-red-600/5 hover:bg-red-600/10'
                    : 'border-divider hover:border-primary-500/30 hover:bg-surface-hover'
                }`}
              >
                {/* Аватарка або обкладинка */}
                <div className="relative shrink-0">
                  <div className="w-14 h-20 rounded-lg bg-surface-hover overflow-hidden border border-divider">
                    {notification.type === NotificationType.NewChapter && notification.titleCoverImageUrl ? (
                      <img
                        src={notification.titleCoverImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-hover">
                        {notification.actorAvatarUrl ? (
                          <img
                            src={notification.actorAvatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-text-muted">
                            {(notification.actorUsername ?? 'S')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.isRead && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-background shadow-sm"></div>
                  )}
                </div>

                {/* Текст сповіщення */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-semibold text-text-primary truncate">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-text-muted whitespace-nowrap ml-4">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                    {notification.type === NotificationType.DirectMessage
                      ? `${notification.actorUsername ?? 'Користувач'} надіслав(-ла) вам повідомлення`
                      : notification.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="px-2 py-0.5 bg-surface-hover rounded">
                      {notification.type === NotificationType.NewChapter
                        ? 'Новий розділ'
                        : notification.type === NotificationType.CommentReply
                        ? 'Відповідь'
                        : notification.type === NotificationType.DirectMessage
                        ? 'Повідомлення'
                        : notification.type === NotificationType.FriendRequest
                        ? 'Заявка в друзі'
                        : 'Завершено'}
                    </span>
                    <span>•</span>
                    <span>{new Date(notification.createdAt).toLocaleString('uk-UA')}</span>
                  </div>
                </div>
              </div>
            );

            return notification.link ? (
              <Link key={notification.id} to={notification.link}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
};
