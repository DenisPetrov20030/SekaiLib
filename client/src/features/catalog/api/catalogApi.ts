import { axiosInstance } from '../../../core/api';
import type { CatalogParams, PagedResponse, Title, Genre } from '../../../core/types';

export const catalogApi = {
  getCatalog: async (params: CatalogParams): Promise<PagedResponse<Title>> => {
    const response = await axiosInstance.get<PagedResponse<Title>>('/titles', { params });
    return response.data;
  },

  searchTitles: async (query: string, page: number, pageSize: number): Promise<PagedResponse<Title>> => {
    const response = await axiosInstance.get<PagedResponse<Title>>('/titles/search', {
      params: { query, page, pageSize },
    });
    return response.data;
  },

  getGenres: async (): Promise<Genre[]> => {
    const response = await axiosInstance.get<Genre[]>('/genres');
    return response.data;
  },
};
