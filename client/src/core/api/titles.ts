import { apiClient } from './client';
import type { TitleDetailsDto, CreateTitleRequest, UpdateTitleRequest } from '../types/dtos';

export const titlesApi = {
  create: async (data: CreateTitleRequest): Promise<TitleDetailsDto> => {
    const response = await apiClient.post<TitleDetailsDto>('/titles', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTitleRequest): Promise<TitleDetailsDto> => {
    const response = await apiClient.put<TitleDetailsDto>(`/titles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/titles/${id}`);
  },

  uploadCover: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('cover', file);
    const response = await apiClient.post<{ coverImageUrl: string }>(`/titles/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.coverImageUrl;
  },
};
