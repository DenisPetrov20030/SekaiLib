import { axiosInstance } from './client';
import type { ReviewComment } from '../types';
import { ReactionType } from '../types/enums';

export interface CreateChapterCommentRequest {
  content: string;
  parentCommentId?: string | null;
}

export interface SetRatingRequest {
  type: ReactionType;
}

export const chapterCommentsApi = {
  get: async (chapterId: string): Promise<ReviewComment[]> => {
    const response = await axiosInstance.get<ReviewComment[]>(`/chapters/${chapterId}/comments`);
    return response.data;
  },
  add: async (chapterId: string, data: CreateChapterCommentRequest): Promise<ReviewComment> => {
    const response = await axiosInstance.post<ReviewComment>(`/chapters/${chapterId}/comments`, data);
    return response.data;
  },
  setReaction: async (chapterId: string, commentId: string, data: SetRatingRequest): Promise<ReviewComment> => {
    const response = await axiosInstance.post<ReviewComment>(`/chapters/${chapterId}/comments/${commentId}/reactions`, data);
    return response.data;
  },
  removeReaction: async (chapterId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/chapters/${chapterId}/comments/${commentId}/reactions`);
  },
  delete: async (chapterId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/chapters/${chapterId}/comments/${commentId}`);
  },
  update: async (chapterId: string, commentId: string, data: { content: string }): Promise<ReviewComment> => {
    const response = await axiosInstance.put<ReviewComment>(`/chapters/${chapterId}/comments/${commentId}`, data);
    return response.data;
  },
};
