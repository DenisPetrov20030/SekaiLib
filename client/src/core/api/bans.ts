import { axiosInstance } from './client';
import type { UserBan } from '../types/entities';

export const bansApi = {
  banUser: (userId: string, data: { reason: string; expiresAt?: string }) =>
    axiosInstance.post<UserBan>(`/admin/users/${userId}/ban`, data),

  unban: (banId: string) =>
    axiosInstance.delete(`/admin/users/bans/${banId}`),

  getActiveBans: () =>
    axiosInstance.get<UserBan[]>('/admin/users/bans'),

  getUserBans: (userId: string) =>
    axiosInstance.get<UserBan[]>(`/admin/users/${userId}/bans`),
};
