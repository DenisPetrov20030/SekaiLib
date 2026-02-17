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

export interface PublisherDto {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface TitleDetailsDto {
  id: string;
  name: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  status: TitleStatus;
  countryOfOrigin: string;
  publisher: PublisherDto;
  genres: Array<{ id: string; name: string }>;
  translationTeams: Array<{ id: string; name: string }>;
  chapters: Array<{ id: string; chapterNumber: number; name: string; publishedAt: string; isPremium: boolean }>;
}

export interface CreateTitleRequest {
  name: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  status: TitleStatus;
  countryOfOrigin: string;
  genreIds: string[];
}

export interface UpdateTitleRequest {
  name: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  status: TitleStatus;
  countryOfOrigin: string;
  genreIds: string[];
}

export interface TitleDto {
  id: string;
  name: string;
  author: string;
  description: string;
  coverImageUrl: string;
  status: TitleStatus;
  chapterCount: number;
  countryOfOrigin?: string;
}

export interface ChapterContentDto {
  id: string;
  number: number;
  name: string;
  content: string;
  publishedAt: string;
  titleId: string;
  titleName: string;
  previousChapterNumber?: number;
  nextChapterNumber?: number;
}

export interface CreateChapterRequest {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
}

export interface UpdateChapterRequest {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
}

// Messaging DTOs
export interface SendMessageRequest {
  text: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherAvatarUrl?: string | null;
  lastMessageText?: string | null;
  lastMessageSenderId?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}
