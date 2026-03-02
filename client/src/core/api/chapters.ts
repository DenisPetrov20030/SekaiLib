import { apiClient } from './client';
import type { ChapterContentDto, CreateChapterRequest, UpdateChapterRequest } from '../types/dtos';

export const chaptersApi = {
  create: async (titleId: string, data: CreateChapterRequest): Promise<ChapterContentDto> => {
    const response = await apiClient.post<ChapterContentDto>(`/chapters/title/${titleId}`, data);
    return response.data;
  },

  update: async (chapterId: string, data: UpdateChapterRequest): Promise<ChapterContentDto> => {
    const response = await apiClient.put<ChapterContentDto>(`/chapters/${chapterId}`, data);
    return response.data;
  },

  delete: async (chapterId: string): Promise<void> => {
    await apiClient.delete(`/chapters/${chapterId}`);
  },

  getById: async (chapterId: string): Promise<ChapterContentDto> => {
    const response = await apiClient.get<ChapterContentDto>(`/chapters/${chapterId}`);
    return response.data;
  },
};
