import { apiClient } from './client';
import type { LinkedAccountDto } from '../types/dtos';

export const authApi = {
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },

  getLinkedAccounts: async (): Promise<LinkedAccountDto[]> => {
    const response = await apiClient.get<LinkedAccountDto[]>('/auth/linked-accounts');
    return response.data;
  },

  unlinkAccount: async (provider: string): Promise<void> => {
    await apiClient.delete(`/auth/linked-accounts/${provider}`);
  },
};
