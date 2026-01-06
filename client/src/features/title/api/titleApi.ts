import { axiosInstance } from '../../../core/api';
import type { TitleDetails, Chapter } from '../../../core/types';

export const titleApi = {
  getTitleById: async (id: string): Promise<TitleDetails> => {
    const response = await axiosInstance.get<TitleDetails>(`/titles/${id}`);
    return response.data;
  },

  getChaptersByTitle: async (titleId: string): Promise<Chapter[]> => {
    const response = await axiosInstance.get<Chapter[]>(`/titles/${titleId}/chapters`);
    return response.data;
  },
};
