import { axiosInstance } from './client';
import type { NewsItem } from '../types/entities';

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const newsApi = {
  getPublished: (page = 1, pageSize = 10) =>
    axiosInstance.get<PagedResponse<NewsItem>>('/news', { params: { page, pageSize } }),

  getAll: (page = 1, pageSize = 20) =>
    axiosInstance.get<PagedResponse<NewsItem>>('/news/all', { params: { page, pageSize } }),

  getById: (id: string) =>
    axiosInstance.get<NewsItem>(`/news/${id}`),

  create: (data: { title: string; content: string; isPublished: boolean }) =>
    axiosInstance.post<NewsItem>('/news', data),

  update: (id: string, data: { title: string; content: string; isPublished: boolean }) =>
    axiosInstance.put<NewsItem>(`/news/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete(`/news/${id}`),
};
