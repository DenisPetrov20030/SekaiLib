import { axiosInstance } from '../../../core/api';
import type { ReadingListItem, UpdateReadingStatusRequest } from '../../../core/types';

export const readingListsApi = {
  getReadingLists: async (): Promise<ReadingListItem[]> => {
    const response = await axiosInstance.get<ReadingListItem[]>('/ReadingLists');
    return response.data;
  },

  getReadingListsByUser: async (userId: string): Promise<ReadingListItem[]> => {
    const response = await axiosInstance.get<ReadingListItem[]>(`/ReadingLists/by-user/${userId}`);
    return response.data;
  },

  addToList: async (data: UpdateReadingStatusRequest): Promise<void> => {
    await axiosInstance.post('/ReadingLists', data);
  },

  updateStatus: async (titleId: string, data: UpdateReadingStatusRequest): Promise<void> => {
    await axiosInstance.put(`/ReadingLists/${titleId}`, data);
  },

  removeFromList: async (titleId: string): Promise<void> => {
    await axiosInstance.delete(`/ReadingLists/${titleId}`);
  },
};
