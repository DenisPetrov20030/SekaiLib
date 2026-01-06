import { axiosInstance } from '../../../core/api';
import type { ReadingListItem, UpdateReadingStatusRequest } from '../../../core/types';

export const readingListsApi = {
  getReadingLists: async (): Promise<ReadingListItem[]> => {
    const response = await axiosInstance.get<ReadingListItem[]>('/reading-lists');
    return response.data;
  },

  addToList: async (data: UpdateReadingStatusRequest): Promise<void> => {
    await axiosInstance.post('/reading-lists', data);
  },

  updateStatus: async (titleId: string, data: UpdateReadingStatusRequest): Promise<void> => {
    await axiosInstance.put(`/reading-lists/${titleId}`, data);
  },

  removeFromList: async (titleId: string): Promise<void> => {
    await axiosInstance.delete(`/reading-lists/${titleId}`);
  },
};
