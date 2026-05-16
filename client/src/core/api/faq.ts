import { axiosInstance } from './client';
import type { FaqItem } from '../types/entities';

export const faqApi = {
  getPublished: () =>
    axiosInstance.get<FaqItem[]>('/faq'),

  getAll: () =>
    axiosInstance.get<FaqItem[]>('/faq/all'),

  create: (data: { question: string; answer: string; order: number; isPublished: boolean }) =>
    axiosInstance.post<FaqItem>('/faq', data),

  update: (id: string, data: { question: string; answer: string; order: number; isPublished: boolean }) =>
    axiosInstance.put<FaqItem>(`/faq/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete(`/faq/${id}`),
};
