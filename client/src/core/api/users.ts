import { apiClient } from './client';
import type { PagedResponse, TitleDto, UserProfile, UserList } from '../types';

export const usersApi = {
  getCurrentProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/me');
    return response.data;
  },

  getProfile: async (userId: string): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(`/users/${userId}`);
    return response.data;
  },

  getUserTitles: async (
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PagedResponse<TitleDto>> => {
    const response = await apiClient.get<PagedResponse<TitleDto>>(`/users/${userId}/titles`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  getCustomLists: async (): Promise<UserList[]> => {
    const response = await apiClient.get<UserList[]>('/userlists');
    return response.data;
  },

  createCustomList: async (name: string): Promise<void> => {
    await apiClient.post('/userlists', name, {
      headers: { 'Content-Type': 'application/json' }
    });
  },
};
