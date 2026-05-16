import { axiosInstance } from './client';

// ── Enums ────────────────────────────────────────────────────────────────────

export const ModerationStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
} as const;
export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];

export const ModerationAction = {
  BanUser: 0,
  UnbanUser: 1,
  WarnUser: 2,
  RevokeWarning: 3,
  ApproveContent: 4,
  RejectContent: 5,
  DeleteContent: 6,
  LockThread: 7,
  PinThread: 8,
  ReviewReport: 9,
  DismissReport: 10,
} as const;
export type ModerationAction = (typeof ModerationAction)[keyof typeof ModerationAction];

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface ModerationQueueItemDto {
  id: string;
  contentType: string;
  contentId: string;
  contentSnapshot?: string | null;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  flagReason: string;
  status: ModerationStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedByUsername?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface ModerationLogDto {
  id: string;
  moderatorId: string;
  moderatorUsername: string;
  moderatorAvatarUrl?: string | null;
  action: ModerationAction;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface ModerationStatsDto {
  pendingQueueCount: number;
  pendingReportCount: number;
  activeBanCount: number;
  totalWarningsToday: number;
}

export interface UserWarningDto {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  issuedById: string;
  issuedByUsername: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
}

export interface BadWordDto {
  id: string;
  word: string;
  addedByUsername: string;
  createdAt: string;
}

export interface UserSearchResultDto {
  id: string;
  username: string;
  avatarUrl?: string | null;
  role: number;
  isBanned: boolean;
  warningCount: number;
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── API ──────────────────────────────────────────────────────────────────────

export const moderationApi = {
  // Queue
  getQueue: (page = 1, pageSize = 20, status?: ModerationStatus) =>
    axiosInstance.get<PagedResult<ModerationQueueItemDto>>('/moderation/queue', {
      params: { page, pageSize, status },
    }),

  getQueueItem: (id: string) =>
    axiosInstance.get<ModerationQueueItemDto>(`/moderation/queue/${id}`),

  approve: (id: string) =>
    axiosInstance.put(`/moderation/queue/${id}/approve`),

  reject: (id: string, reason?: string) =>
    axiosInstance.put(`/moderation/queue/${id}/reject`, { reason }),

  // Logs
  getLogs: (page = 1, pageSize = 20) =>
    axiosInstance.get<PagedResult<ModerationLogDto>>('/moderation/logs', {
      params: { page, pageSize },
    }),

  // Stats
  getStats: () =>
    axiosInstance.get<ModerationStatsDto>('/moderation/stats'),

  // Warnings
  issueWarning: (userId: string, reason: string) =>
    axiosInstance.post<UserWarningDto>('/moderation/warnings', { userId, reason }),

  revokeWarning: (warningId: string) =>
    axiosInstance.delete(`/moderation/warnings/${warningId}`),

  getUserWarnings: (userId: string) =>
    axiosInstance.get<UserWarningDto[]>(`/moderation/users/${userId}/warnings`),

  // Bad words
  getBadWords: () =>
    axiosInstance.get<BadWordDto[]>('/moderation/bad-words'),

  addBadWord: (word: string) =>
    axiosInstance.post<BadWordDto>('/moderation/bad-words', { word }),

  removeBadWord: (id: string) =>
    axiosInstance.delete(`/moderation/bad-words/${id}`),

  // User search
  searchUsers: (q: string) =>
    axiosInstance.get<UserSearchResultDto[]>('/admin/users/search', { params: { q } }),
};
