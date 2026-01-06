import { apiClient } from './client';
import type { TitleDetailsDto, CreateTitleRequest, UpdateTitleRequest } from '../types/dtos';

export const titlesApi = {
  create: async (data: CreateTitleRequest): Promise<TitleDetailsDto> => {
    const response = await apiClient.post('/titles', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTitleRequest): Promise<TitleDetailsDto> => {
    const response = await apiClient.put(`/titles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/titles/${id}`);
  },
};
