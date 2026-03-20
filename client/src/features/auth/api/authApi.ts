import { axiosInstance } from '../../../core/api';
import { API_BASE_URL } from '../../../core/constants';
import type { LoginRequest, RegisterRequest, AuthResponse, AuthProvider } from '../../../core/types';

const buildOAuthStartUrl = (provider: AuthProvider, returnUrl: string) => {
  return `${API_BASE_URL}/auth/oauth/${provider}/start?returnUrl=${encodeURIComponent(returnUrl)}`;
};

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  completeOAuth: async (ticket: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/oauth/complete', { ticket });
    return response.data;
  },

  startOAuth: (provider: AuthProvider, returnUrl = '/catalog') => {
    window.location.href = buildOAuthStartUrl(provider, returnUrl);
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await axiosInstance.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};
