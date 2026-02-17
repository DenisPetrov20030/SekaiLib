import { axiosInstance } from '../../../core/api';
import type { User, UserStatistics, UpdateProfileRequest } from '../../../core/types';

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<User>('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await axiosInstance.put<User>('/users/profile', data);
    return response.data;
  },

  getStatistics: async (): Promise<UserStatistics> => {
    const response = await axiosInstance.get<UserStatistics>('/users/statistics');
    return response.data;
  },
};
