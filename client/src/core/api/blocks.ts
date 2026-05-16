import { apiClient } from './client';
import type { BlockedUserDto } from '../types/dtos';

export const blocksApi = {
  block: (userId: string) =>
    apiClient.post(`/blocks/${userId}`),

  unblock: (userId: string) =>
    apiClient.delete(`/blocks/${userId}`),

  isBlocked: (userId: string) =>
    apiClient.get<boolean>(`/blocks/${userId}/status`),

  getBlockedUsers: () =>
    apiClient.get<string[]>('/blocks'),

  getBlockedUsersWithDetails: async (): Promise<BlockedUserDto[]> => {
    const response = await apiClient.get<BlockedUserDto[]>('/blocks/details');
    return response.data;
  },
};
