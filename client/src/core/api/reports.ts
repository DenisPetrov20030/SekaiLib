import { axiosInstance } from './client';
import type { Report } from '../types/entities';
import type { ReportTargetType, ReportStatus } from '../types/enums';

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const reportsApi = {
  create: (data: {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    description?: string;
  }) => axiosInstance.post<Report>('/reports', data),

  getAll: (page = 1, pageSize = 20) =>
    axiosInstance.get<PagedResponse<Report>>('/reports', { params: { page, pageSize } }),

  getById: (reportId: string) => axiosInstance.get<Report>(`/reports/${reportId}`),

  delete: (reportId: string) => axiosInstance.delete(`/reports/${reportId}`),

  review: (reportId: string, data: { status: ReportStatus; adminNote?: string }) =>
    axiosInstance.put<Report>(`/reports/${reportId}/review`, data),
};
