export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}
