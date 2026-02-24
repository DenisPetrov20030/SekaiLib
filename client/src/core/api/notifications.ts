import { apiClient } from './client';
import type { NotificationDto, NotificationType } from '../types/dtos';

export const notificationsApi = {
  getNotifications: async (type?: NotificationType, take: number = 50): Promise<NotificationDto[]> => {
    const response = await apiClient.get<NotificationDto[]>('/notifications', {
      params: { type, take },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },
};
