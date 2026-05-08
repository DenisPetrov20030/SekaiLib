import { axiosInstance } from './client';
import type { ReviewComment } from '../types';
import { ReactionType } from '../types/enums';

export interface CreateTitleCommentRequest {
  content: string;
  parentCommentId?: string | null;
}

export interface UpdateTitleCommentRequest {
  content: string;
}

export interface SetRatingRequest {
  type: ReactionType;
}

export const titleCommentsApi = {
  get: async (titleId: string): Promise<ReviewComment[]> => {
    const response = await axiosInstance.get<ReviewComment[]>(`/titles/${titleId}/comments`);
    return response.data;
  },
  add: async (titleId: string, data: CreateTitleCommentRequest): Promise<ReviewComment> => {
    const response = await axiosInstance.post<ReviewComment>(`/titles/${titleId}/comments`, data);
    return response.data;
  },
  update: async (titleId: string, commentId: string, data: UpdateTitleCommentRequest): Promise<ReviewComment> => {
    const response = await axiosInstance.put<ReviewComment>(`/titles/${titleId}/comments/${commentId}`, data);
    return response.data;
  },
  setReaction: async (titleId: string, commentId: string, data: SetRatingRequest): Promise<ReviewComment> => {
    const response = await axiosInstance.post<ReviewComment>(`/titles/${titleId}/comments/${commentId}/reactions`, data);
    return response.data;
  },
  removeReaction: async (titleId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/titles/${titleId}/comments/${commentId}/reactions`);
  },
  delete: async (titleId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/titles/${titleId}/comments/${commentId}`);
  },
};
