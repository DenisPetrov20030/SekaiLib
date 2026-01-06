import { apiClient } from './client';

export interface Genre {
  id: string;
  name: string;
}

export interface CreateGenreRequest {
  name: string;
}

export interface UpdateGenreRequest {
  name: string;
}

export const genresApi = {
  getAll: async (): Promise<Genre[]> => {
    const response = await apiClient.get('/admin/genres');
    return response.data;
  },

  create: async (data: CreateGenreRequest): Promise<Genre> => {
    const response = await apiClient.post('/admin/genres', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGenreRequest): Promise<Genre> => {
    const response = await apiClient.put(`/admin/genres/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/genres/${id}`);
  },
};
