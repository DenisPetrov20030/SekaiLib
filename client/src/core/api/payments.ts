import { apiClient } from './client';

export interface CreateChapterPaymentResponse {
  orderId: string;
  data: string;
  signature: string;
  checkoutUrl: string;
  amount: number;
  chapterName: string;
}

export interface PaymentStatusDto {
  orderId: string;
  status: 'Pending' | 'Success' | 'Failure' | 'Reversed' | 'Sandbox';
  amount: number;
  createdAt: string;
  completedAt?: string | null;
}

export interface PurchaseDto {
  id: string;
  chapterId?: string | null;
  chapterName?: string | null;
  chapterNumber?: number | null;
  titleName?: string | null;
  amountPaid: number;
  purchasedAt: string;
}

export const paymentsApi = {
  createChapterPayment: async (chapterId: string): Promise<CreateChapterPaymentResponse> => {
    const response = await apiClient.post<CreateChapterPaymentResponse>('/payments/chapter-payment', { chapterId });
    return response.data;
  },

  getPaymentStatus: async (orderId: string): Promise<PaymentStatusDto> => {
    const response = await apiClient.get<PaymentStatusDto>(`/payments/status/${orderId}`);
    return response.data;
  },

  getMyPurchases: async (): Promise<PurchaseDto[]> => {
    const response = await apiClient.get<PurchaseDto[]>('/payments/my-purchases');
    return response.data;
  },

  checkAccess: async (chapterId: string): Promise<{ chapterId: string; hasAccess: boolean }> => {
    const response = await apiClient.get<{ chapterId: string; hasAccess: boolean }>(`/payments/access/${chapterId}`);
    return response.data;
  },

  /** Force-pull status from LiqPay API (fallback when server_url callback was missed). */
  refreshStatus: async (orderId: string): Promise<PaymentStatusDto> => {
    const response = await apiClient.post<PaymentStatusDto>(`/payments/status/${orderId}/refresh`);
    return response.data;
  },

  /** Dev only — simulate success without LiqPay */
  devSimulate: async (orderId: string): Promise<void> => {
    await apiClient.post(`/payments/dev/simulate/${orderId}`);
  },
};
