import api from '../config/axios';
import { getApiUrl } from '../config/api.config';

export interface AccessRequest {
  id: number;
  uploadId: number;
  documentName: string | null;
  requesterId: string;
  ownerId: string;
  status: string;
  requestTime: string;
  decisionTime: string | null;
  reviewerId: string | null;
  licenseExpiry: string | null;
}

export interface ApiResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    content: AccessRequest[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

export const digitalService = {
  getUserDigitalBooks: async (userId: string, page: number = 0) => {
    const response = await api.get<ApiResponse>(getApiUrl(`/api/v1/access-requests/user?userId=${userId}&page=${page}`));
    return response.data;
  },
};  