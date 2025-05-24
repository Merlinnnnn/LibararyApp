// Common API Response Type
export interface APIResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

// Common Error Response
export interface APIError {
  code: number;
  success: false;
  message: string;
  data: null;
} 