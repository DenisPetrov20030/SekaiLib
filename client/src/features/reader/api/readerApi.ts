import { axiosInstance } from '../../../core/api';
import type { ChapterContent, UpdateReadingProgressRequest } from '../../../core/types';

export const readerApi = {
  getChapterContent: async (titleId: string, chapterNumber: number): Promise<ChapterContent> => {
    const response = await axiosInstance.get<ChapterContent>(
      `/titles/${titleId}/chapters/${chapterNumber}/content`
    );
    return response.data;
  },

  updateReadingProgress: async (data: UpdateReadingProgressRequest): Promise<void> => {
    await axiosInstance.post('/reading-progress', data);
  },
};
