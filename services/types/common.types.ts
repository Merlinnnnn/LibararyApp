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
  success: boolean;
  message: string;
  data: null;
}

export interface SortDetail {
  property: string;
  direction: string;
}

export interface PageDTO<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  sortDetails: SortDetail[];
} 