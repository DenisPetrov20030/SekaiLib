import { axiosInstance } from './client';
import type { Review, TitleRating } from '../types';
import type { ReviewComment } from '../types';
import type { ReactionType } from '../types/enums';

export interface CreateReviewRequest {
  content: string;
  rating: number;
}

export interface UpdateReviewRequest {
  content: string;
  rating: number;
}

export interface SetRatingRequest {
  type: ReactionType;
}

export interface CreateReviewCommentRequest {
  content: string;
  parentCommentId?: string;
}

export const reviewsApi = {
  getByTitle: async (titleId: string): Promise<Review[]> => {
    const response = await axiosInstance.get<Review[]>(`/titles/${titleId}/reviews`);
    return response.data;
  },

  create: async (titleId: string, data: CreateReviewRequest): Promise<Review> => {
    const response = await axiosInstance.post<Review>(`/titles/${titleId}/reviews`, data);
    return response.data;
  },

  update: async (titleId: string, reviewId: string, data: UpdateReviewRequest): Promise<Review> => {
    const response = await axiosInstance.put<Review>(`/titles/${titleId}/reviews/${reviewId}`, data);
    return response.data;
  },

  delete: async (titleId: string, reviewId: string): Promise<void> => {
    await axiosInstance.delete(`/titles/${titleId}/reviews/${reviewId}`);
  },

  setReaction: async (titleId: string, reviewId: string, data: SetRatingRequest): Promise<Review> => {
    const response = await axiosInstance.post<Review>(`/titles/${titleId}/reviews/${reviewId}/reactions`, data);
    return response.data;
  },

  removeReaction: async (titleId: string, reviewId: string): Promise<void> => {
    await axiosInstance.delete(`/titles/${titleId}/reviews/${reviewId}/reactions`);
  },

  addComment: async (titleId: string, reviewId: string, data: CreateReviewCommentRequest): Promise<ReviewComment> => {
    const response = await axiosInstance.post<ReviewComment>(`/titles/${titleId}/reviews/${reviewId}/comments`, data);
    return response.data;
  },

  setCommentReaction: async (titleId: string, reviewId: string, commentId: string, data: SetRatingRequest): Promise<ReviewComment> => {
    const response = await axiosInstance.post<ReviewComment>(`/titles/${titleId}/reviews/${reviewId}/comments/${commentId}/reactions`, data);
    return response.data;
  },

  removeCommentReaction: async (titleId: string, reviewId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/titles/${titleId}/reviews/${reviewId}/comments/${commentId}/reactions`);
  },
  deleteComment: async (titleId: string, reviewId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/titles/${titleId}/reviews/${reviewId}/comments/${commentId}`);
  },
  updateComment: async (titleId: string, reviewId: string, commentId: string, data: { content: string }): Promise<ReviewComment> => {
    const response = await axiosInstance.put<ReviewComment>(`/titles/${titleId}/reviews/${reviewId}/comments/${commentId}`, data);
    return response.data;
  },
};

export const ratingsApi = {
  get: async (titleId: string): Promise<TitleRating> => {
    const response = await axiosInstance.get<TitleRating>(`/titles/${titleId}/rating`);
    return response.data;
  },

  set: async (titleId: string, data: SetRatingRequest): Promise<TitleRating> => {
    const response = await axiosInstance.post<TitleRating>(`/titles/${titleId}/rating`, data);
    return response.data;
  },

  remove: async (titleId: string): Promise<TitleRating> => {
    const response = await axiosInstance.delete<TitleRating>(`/titles/${titleId}/rating`);
    return response.data;
  },
};
