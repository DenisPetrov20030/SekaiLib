import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, TOKEN_STORAGE_KEY, ACCESS_TOKEN_STORAGE_KEY } from '../constants';
import type { ApiError } from '../types';
import { storage } from '../utils';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = storage.get<string>(TOKEN_STORAGE_KEY);
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', { refreshToken });
              const { accessToken } = response.data;

              this.setAccessToken(accessToken);
              this.refreshSubscribers.forEach((callback) => callback(accessToken));
              this.refreshSubscribers = [];

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }

              return this.client(originalRequest);
            }
          } catch {
            this.clearTokens();
            window.location.href = '/login';
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      statusCode: 500,
    };

    if (error.response) {
      const data = error.response.data as { message?: string; errors?: Record<string, string[]> };
      apiError.statusCode = error.response.status;
      apiError.message = data.message || error.message;
      apiError.errors = data.errors;
    } else if (error.request) {
      apiError.message = 'Network error. Please check your connection.';
    }

    return apiError;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      storage.set(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      storage.remove(ACCESS_TOKEN_STORAGE_KEY);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    storage.remove(TOKEN_STORAGE_KEY);
    storage.remove(ACCESS_TOKEN_STORAGE_KEY);
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
export const axiosInstance = apiClient.getClient();
