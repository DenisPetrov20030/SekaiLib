import { apiClient } from './client';

export interface ForumCategoryDto {
  id: string;
  name: string;
  description?: string | null;
  iconEmoji?: string | null;
  sortOrder: number;
  threadCount: number;
  postCount: number;
  lastPostAt?: string | null;
  lastPostUsername?: string | null;
  lastPostThreadTitle?: string | null;
}

export interface ForumThreadDto {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  lastPostAt: string;
  lastPostUsername?: string | null;
}

export interface ForumThreadDetailsDto {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
}

export interface ForumPostDto {
  id: string;
  threadId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  content: string;
  quotedPostId?: string | null;
  quotedPostContent?: string | null;
  quotedPostAuthorUsername?: string | null;
  isEdited: boolean;
  likeCount: number;
  dislikeCount: number;
  userReaction?: boolean | null;  // true=like, false=dislike, null=none
  createdAt: string;
  updatedAt?: string | null;
  isOwn: boolean;
  canDelete: boolean;
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const forumApi = {
  // Categories
  getCategories: async (): Promise<ForumCategoryDto[]> => {
    const res = await apiClient.get<ForumCategoryDto[]>('/forum/categories');
    return res.data;
  },
  createCategory: async (data: { name: string; description?: string; iconEmoji?: string; sortOrder?: number }): Promise<ForumCategoryDto> => {
    const res = await apiClient.post<ForumCategoryDto>('/forum/categories', data);
    return res.data;
  },
  updateCategory: async (id: string, data: { name: string; description?: string; iconEmoji?: string; sortOrder?: number; isVisible?: boolean }): Promise<ForumCategoryDto> => {
    const res = await apiClient.put<ForumCategoryDto>(`/forum/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/forum/categories/${id}`);
  },

  // Threads
  getThreads: async (categoryId: string, page = 1, pageSize = 20): Promise<PagedResult<ForumThreadDto>> => {
    const res = await apiClient.get<PagedResult<ForumThreadDto>>(`/forum/categories/${categoryId}/threads`, { params: { page, pageSize } });
    return res.data;
  },
  searchThreads: async (q: string, page = 1, pageSize = 20): Promise<PagedResult<ForumThreadDto>> => {
    const res = await apiClient.get<PagedResult<ForumThreadDto>>('/forum/threads/search', { params: { q, page, pageSize } });
    return res.data;
  },
  getThread: async (threadId: string): Promise<ForumThreadDetailsDto> => {
    const res = await apiClient.get<ForumThreadDetailsDto>(`/forum/threads/${threadId}`);
    return res.data;
  },
  createThread: async (data: { categoryId: string; title: string; content: string }): Promise<ForumThreadDetailsDto> => {
    const res = await apiClient.post<ForumThreadDetailsDto>('/forum/threads', data);
    return res.data;
  },
  updateThread: async (threadId: string, data: { title: string }): Promise<ForumThreadDetailsDto> => {
    const res = await apiClient.put<ForumThreadDetailsDto>(`/forum/threads/${threadId}`, data);
    return res.data;
  },
  deleteThread: async (threadId: string): Promise<void> => {
    await apiClient.delete(`/forum/threads/${threadId}`);
  },
  pinThread: async (threadId: string, pinned: boolean): Promise<void> => {
    await apiClient.put(`/forum/threads/${threadId}/pin`, null, { params: { pinned } });
  },
  lockThread: async (threadId: string, locked: boolean): Promise<void> => {
    await apiClient.put(`/forum/threads/${threadId}/lock`, null, { params: { locked } });
  },

  // Posts
  getPosts: async (threadId: string, page = 1, pageSize = 30): Promise<PagedResult<ForumPostDto>> => {
    const res = await apiClient.get<PagedResult<ForumPostDto>>(`/forum/threads/${threadId}/posts`, { params: { page, pageSize } });
    return res.data;
  },
  createPost: async (threadId: string, data: { content: string; quotedPostId?: string }): Promise<ForumPostDto> => {
    const res = await apiClient.post<ForumPostDto>(`/forum/threads/${threadId}/posts`, data);
    return res.data;
  },
  updatePost: async (postId: string, data: { content: string }): Promise<ForumPostDto> => {
    const res = await apiClient.put<ForumPostDto>(`/forum/posts/${postId}`, data);
    return res.data;
  },
  deletePost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/forum/posts/${postId}`);
  },
  react: async (postId: string, isLike: boolean): Promise<ForumPostDto> => {
    const res = await apiClient.post<ForumPostDto>(`/forum/posts/${postId}/react`, { isLike });
    return res.data;
  },
  removeReaction: async (postId: string): Promise<ForumPostDto> => {
    const res = await apiClient.delete<ForumPostDto>(`/forum/posts/${postId}/react`);
    return res.data;
  },
};
