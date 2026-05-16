import { UserRole, TitleStatus, ReadingStatus, ReactionType, ReportTargetType, ReportStatus } from './enums';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  isBanned?: boolean;
  banReason?: string | null;
  banExpiresAt?: string | null;
}

export interface Title {
  id: string;
  name: string;
  author: string;
  coverImageUrl?: string;
  description: string;
  status: TitleStatus;
  countryOfOrigin: string;
}

export interface TitleDetails extends Title {
  publisher?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  genres: Genre[];
  translationTeams: TranslationTeam[];
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  titleId: string;
  chapterNumber: number;
  name: string;
  isPremium: boolean;
  publishedAt: string;
  translationTeamId?: string | null;
  translationTeamName?: string | null;
}

export interface ChapterContent {
  id: string;
  chapterNumber: number;
  name: string;
  content: string;
  titleId: string;
  titleName: string;
  previousChapterNumber?: number;
  nextChapterNumber?: number;
  viewCount?: number;
}

export interface Genre {
  id: string;
  name: string;
}

export interface TranslationTeam {
  id: string;
  name: string;
}

export interface ReadingListTitle {
  id: string;
  name: string;
  author: string;
  coverImageUrl?: string;
  status: TitleStatus;
}

export interface ReadingListItem {
  titleId: string;
  title: ReadingListTitle;
  status: ReadingStatus;
  addedAt: string;
  userListId?: string | null;
}

export interface ReadingProgress {
  titleId: string;
  chapterId: string;
  chapterNumber: number;
  progress: number;
  lastReadAt: string;
}

export interface UserStatistics {
  totalTitlesInLists: number;
  totalChaptersRead: number;
  readingStreak: number;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  titleId: string;
  title: string;
  content: string;
  rating: number;
  likesCount: number;
  dislikesCount: number;
  viewCount: number;
  commentsCount?: number;
  userReaction?: ReactionType;
  createdAt: string;
  updatedAt: string;
  comments?: ReviewComment[];
  reviewerScore: number;
}

export interface ReviewComment {
  id: string;
  parentCommentId?: string | null;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  userReaction?: ReactionType;
  replies?: ReviewComment[];
}

export interface TitleRating {
  likesCount: number;
  dislikesCount: number;
  userRating?: ReactionType;
}
export interface UserList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  titles?: Title[];
  titlesCount?: number;
  description?: string;
}

export interface UserBan {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  bannedByUserId: string;
  bannedByUsername: string;
  reason: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string | null;
  targetUsername?: string | null;
  reason: string;
  description?: string;
  status: ReportStatus;
  adminNote?: string;
  reviewedByUserId?: string;
  reviewedByUsername?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}