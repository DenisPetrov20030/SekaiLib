export type AuthProvider = 'google';
import { ReadingStatus, TitleStatus, UserRole } from './enums';
import { Gender } from './enums';

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
    isBanned?: boolean;
    banReason?: string | null;
    banExpiresAt?: string | null;
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
  username: string;
  gender: Gender;
  aboutMe?: string | null;
  notifyListStatuses?: number[] | null;
  notifyUserListIds?: string[] | null;
  notifyTitleCompleted?: boolean | null;
  notifyFriendRequests?: boolean | null;
  profileVisibility?: number | null;
  blockedGenreIds?: string[] | null;
}

export interface LinkedAccountDto {
  provider: string;
  providerUserId: string;
  linkedAt: string;
}

export interface BlockedUserDto {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  blockedAt: string;
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
  chapters: Array<{ id: string; chapterNumber: number; name: string; publishedAt: string; isPremium: boolean; price?: number; earlyAccessUntil?: string | null }>;
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

export interface CreateReviewRequest {
  title: string;
  content: string;
  rating: number;
}

export interface UpdateReviewRequest {
  title: string;
  content: string;
  rating: number;
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
  averageScore?: number | null;
  reviewsCount?: number;
}

export interface ChapterContentDto {
  id: string;
  number: number;
  name: string;
  content: string;
  publishedAt: string;
  titleId: string;
  titleName: string;
  translationTeamId?: string | null;
  translationTeamName?: string | null;
  previousChapterNumber?: number;
  nextChapterNumber?: number;
  viewCount: number;
  isPremium?: boolean;
  isLocked?: boolean;
  price?: number;
  earlyAccessUntil?: string | null;
}

export interface CreateChapterRequest {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
  price?: number;
  translationTeamId?: string | null;
  earlyAccessUntil?: string | null;
}

export interface UpdateChapterRequest {
  chapterNumber: number;
  name: string;
  content: string;
  isPremium: boolean;
  price?: number;
  translationTeamId?: string | null;
  earlyAccessUntil?: string | null;
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
  coverImageUrl?: string | null;
  ownerId: string;
  ownerUsername: string;
  memberCount: number;
  chapterCount: number;
  titleCount: number;
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

export interface TeamUserSearchDto {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
}

export interface UpdateTeamRequest {
  name: string;
  description: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
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
  titleId?: string | null;
  titleName?: string | null;
  titleCoverImageUrl?: string | null;
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

