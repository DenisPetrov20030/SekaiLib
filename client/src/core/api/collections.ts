import { apiClient } from './client';

export interface CollectionItemDto {
  id: string;
  titleId: string;
  titleName: string;
  coverImageUrl?: string | null;
  sortOrder: number;
}

export interface CollectionSectionDto {
  id: string;
  name: string;
  sortOrder: number;
  items: CollectionItemDto[];
}

export interface CollectionDto {
  id: string;
  title: string;
  description?: string | null;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  isPublic: boolean;
  viewCount: number;
  commentCount: number;
  titleCount: number;
  likeCount: number;
  dislikeCount: number;
  coverImages: string[];
  createdAt: string;
  containsTitle?: boolean;
}

export interface CollectionDetailsDto extends CollectionDto {
  userReaction?: boolean | null;
  sections: CollectionSectionDto[];
  uncategorizedItems: CollectionItemDto[];
}

export interface CollectionCommentDto {
  id: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  content: string;
  parentCommentId?: string | null;
  replyCount: number;
  createdAt: string;
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const collectionsApi = {
  getAll: async (params?: { search?: string; page?: number; pageSize?: number }): Promise<PagedResult<CollectionDto>> => {
    const response = await apiClient.get<PagedResult<CollectionDto>>('/collections', { params });
    return response.data;
  },

  getById: async (id: string): Promise<CollectionDetailsDto> => {
    const response = await apiClient.get<CollectionDetailsDto>(`/collections/${id}`);
    return response.data;
  },

  getByUser: async (userId: string, titleId?: string): Promise<CollectionDto[]> => {
    const response = await apiClient.get<CollectionDto[]>(`/collections/by-user/${userId}`, {
      params: titleId ? { titleId } : undefined,
    });
    return response.data;
  },

  create: async (data: { title: string; description?: string; isPublic: boolean }): Promise<CollectionDetailsDto> => {
    const response = await apiClient.post<CollectionDetailsDto>('/collections', data);
    return response.data;
  },

  update: async (id: string, data: { title: string; description?: string; isPublic: boolean }): Promise<CollectionDetailsDto> => {
    const response = await apiClient.put<CollectionDetailsDto>(`/collections/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/collections/${id}`);
  },

  // Sections
  addSection: async (collectionId: string, name: string): Promise<CollectionSectionDto> => {
    const response = await apiClient.post<CollectionSectionDto>(`/collections/${collectionId}/sections`, { name });
    return response.data;
  },

  updateSection: async (collectionId: string, sectionId: string, name: string): Promise<void> => {
    await apiClient.put(`/collections/${collectionId}/sections/${sectionId}`, { name });
  },

  deleteSection: async (collectionId: string, sectionId: string): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/sections/${sectionId}`);
  },

  // Items
  addItem: async (collectionId: string, data: { titleId: string; sectionId?: string }): Promise<CollectionItemDto> => {
    const response = await apiClient.post<CollectionItemDto>(`/collections/${collectionId}/items`, data);
    return response.data;
  },

  removeItem: async (collectionId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/items/${itemId}`);
  },

  updateItemSection: async (collectionId: string, itemId: string, sectionId?: string): Promise<void> => {
    await apiClient.put(`/collections/${collectionId}/items/${itemId}/section`, { sectionId: sectionId ?? null });
  },

  // Reactions
  react: async (collectionId: string, isLike: boolean): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/react`, { isLike });
  },

  removeReaction: async (collectionId: string): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/react`);
  },

  // Comments
  getComments: async (collectionId: string): Promise<CollectionCommentDto[]> => {
    const response = await apiClient.get<CollectionCommentDto[]>(`/collections/${collectionId}/comments`);
    return response.data;
  },

  getReplies: async (collectionId: string, commentId: string): Promise<CollectionCommentDto[]> => {
    const response = await apiClient.get<CollectionCommentDto[]>(`/collections/${collectionId}/comments/${commentId}/replies`);
    return response.data;
  },

  addComment: async (collectionId: string, data: { content: string; parentCommentId?: string }): Promise<CollectionCommentDto> => {
    const response = await apiClient.post<CollectionCommentDto>(`/collections/${collectionId}/comments`, data);
    return response.data;
  },

  deleteComment: async (collectionId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/comments/${commentId}`);
  },
};
