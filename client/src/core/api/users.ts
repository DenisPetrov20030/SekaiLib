import { apiClient } from './client';
import type { PagedResponse, TitleDto } from '../types';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export const usersApi = {
  getProfile: async (userId: string): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  getUserTitles: async (
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PagedResponse<TitleDto>> => {
    const response = await apiClient.get(`/users/${userId}/titles`, {
      params: { page, pageSize },
    });
    return response.data;
  },
};
