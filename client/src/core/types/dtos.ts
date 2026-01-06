import { ReadingStatus, TitleStatus, UserRole } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    createdAt: string;
  };
}

export interface CatalogFilters {
  search?: string;
  genreId?: string;
  country?: string;
  status?: TitleStatus;
}

export interface CatalogParams extends CatalogFilters {
  page: number;
  pageSize: number;
}

export interface PagedResponse<T> {
  data: T[];
  items?: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UpdateReadingStatusRequest {
  titleId: string;
  status: ReadingStatus;
}

export interface UpdateReadingProgressRequest {
  chapterId: string;
  progress: number;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}
