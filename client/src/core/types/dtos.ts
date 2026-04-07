export type AuthProvider = 'google';
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
  genreIds?: string[];
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
  viewCount: number;
}

export interface CreateChapterRequest {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
  translationTeamId?: string | null;
}

export interface UpdateChapterRequest {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
}

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

export interface FriendDto {
  id: string;
  username: string;
  avatarUrl?: string | null;
}
export interface FriendRequestDto {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatarUrl?: string | null;
  toUserId: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}

export const TeamMemberRole = {
  Owner: 0,
  Admin: 1,
  Member: 2,
} as const;

export type TeamMemberRole = typeof TeamMemberRole[keyof typeof TeamMemberRole];

export interface TranslationTeamDto {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string | null;
  ownerId: string;
  ownerUsername: string;
  memberCount: number;
  chapterCount: number;
  subscriberCount: number;
  createdAt: string;
}

export interface TeamMemberDto {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  role: TeamMemberRole;
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
  avatarUrl?: string | null;
}

export interface UpdateTeamRequest {
  name: string;
  description: string;
  avatarUrl?: string | null;
}

export interface AddMemberRequest {
  userId: string;
  role: TeamMemberRole;
}

export interface TeamChapterDto {
  id: string;
  chapterNumber: number;
  name: string;
  publishedAt: string;
  isPremium: boolean;
  translationTeamId?: string | null;
  translationTeamName?: string | null;
}

export interface SubscribedTeamChapterDto {
  chapterId: string;
  chapterNumber: number;
  chapterName: string;
  publishedAt: string;
  isPremium: boolean;
  titleId: string;
  titleName: string;
  titleCoverImageUrl?: string | null;
  teamId: string;
  teamName: string;
}

export interface TeamChaptersResponse {
  data: TeamChapterDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const NotificationType = {
  NewChapter: 0,
  CommentReply: 1,
  DirectMessage: 2,
  FriendRequest: 3,
  TitleCompleted: 4,
  NewTeamChapter: 5,
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  actorUserId?: string | null;
  actorUsername?: string | null;
  actorAvatarUrl?: string | null;
  titleId?: string | null;
  titleCoverImageUrl?: string | null;
}

