import { axiosInstance } from '../../../core/api';
import type { CatalogParams, PagedResponse, Title, Genre } from '../../../core/types';

export const catalogApi = {
  getCatalog: async (params: CatalogParams): Promise<PagedResponse<Title>> => {
    const queryParams = new URLSearchParams();

    if (params.search) {
      queryParams.append('search', params.search);
    }

    if (params.genreIds && params.genreIds.length > 0) {
      params.genreIds.forEach((genreId) => queryParams.append('genreIds', genreId));
    }

    if (params.country) {
      queryParams.append('country', params.country);
    }

    if (params.status !== undefined) {
      queryParams.append('status', String(params.status));
    }

    queryParams.append('page', String(params.page));
    queryParams.append('pageSize', String(params.pageSize));

    const response = await axiosInstance.get<PagedResponse<Title>>('/titles', { params: queryParams });
    return response.data;
  },

  searchTitles: async (query: string, page: number, pageSize: number): Promise<PagedResponse<Title>> => {
    const response = await axiosInstance.get<PagedResponse<Title>>('/titles/search', {
      params: { query, page, pageSize },
    });
    return response.data;
  },

  getGenres: async (): Promise<Genre[]> => {
    const response = await axiosInstance.get<Genre[]>('/admin/genres');
    return response.data;
  },
};
