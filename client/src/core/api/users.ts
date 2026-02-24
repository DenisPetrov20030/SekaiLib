import { apiClient } from './client';
import type { PagedResponse, TitleDto, UserProfile, UserList, FriendDto, FriendRequestDto } from '../types';

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

  getUserCustomLists: async (userId: string): Promise<UserList[]> => {
    const response = await apiClient.get<UserList[]>(`/userlists/by-user/${userId}`);
    return response.data;
  },

  createCustomList: async (name: string): Promise<void> => {
    await apiClient.post('/userlists', name, {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const form = new FormData();
    form.append('avatar', file);
    const response = await apiClient.post<{ avatarUrl: string }>("/users/me/avatar", form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getFriendshipStatus: async (userId: string): Promise<{ isFriend: boolean }> => {
    const response = await apiClient.get<{ isFriend: boolean }>(`/users/${userId}/friendship`);
    return response.data;
  },

  addFriend: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/friends`);
  },

  removeFriend: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/friends`);
  },

  getFriends: async (userId: string): Promise<FriendDto[]> => {
    const response = await apiClient.get<FriendDto[]>(`/users/${userId}/friends`);
    return response.data;
  },

  getFriendsCount: async (userId: string): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>(`/users/${userId}/friends/count`);
    return response.data;
  },

  sendFriendRequest: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/friend-requests/${userId}/send`);
  },

  getIncomingRequests: async (): Promise<FriendRequestDto[]> => {
    const response = await apiClient.get<FriendRequestDto[]>('/users/friend-requests/incoming');
    return response.data;
  },

  getOutgoingRequests: async (): Promise<FriendRequestDto[]> => {
    const response = await apiClient.get<FriendRequestDto[]>('/users/friend-requests/outgoing');
    return response.data;
  },

  acceptFriendRequest: async (requestId: string): Promise<void> => {
    await apiClient.put(`/users/friend-requests/${requestId}/accept`);
  },

  rejectFriendRequest: async (requestId: string): Promise<void> => {
    await apiClient.put(`/users/friend-requests/${requestId}/reject`);
  },
};
