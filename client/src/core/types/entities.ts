import { UserRole, TitleStatus, ReadingStatus, ReactionType } from './enums';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
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
  content: string;
  rating: number;
  likesCount: number;
  dislikesCount: number;
  userReaction?: ReactionType;
  createdAt: string;
  updatedAt: string;
}

export interface TitleRating {
  likesCount: number;
  dislikesCount: number;
  userRating?: ReactionType;
}
