import { axiosInstance } from './client';

export const blocksApi = {
  block: (userId: string) =>
    axiosInstance.post(`/blocks/${userId}`),

  unblock: (userId: string) =>
    axiosInstance.delete(`/blocks/${userId}`),

  isBlocked: (userId: string) =>
    axiosInstance.get<boolean>(`/blocks/${userId}/status`),

  getBlockedUsers: () =>
    axiosInstance.get<string[]>('/blocks'),
};
