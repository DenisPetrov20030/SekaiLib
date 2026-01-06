import { axiosInstance } from './client';
import type { Review, TitleRating } from '../types';
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
