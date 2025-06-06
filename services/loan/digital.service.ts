import api from '../config/axios';
import { getApiUrl } from '../config/api.config';

export interface DigitalDocument {
  digitalDocumentId: number;
  documentName: string;
  author: string;
  publisher: string;
  description: string;
  coverImage: string | null;
  approvalStatus: string;
  visibilityStatus: string;
  uploads: {
    uploadId: number;
    fileName: string;
    fileType: string;
    filePath: string;
    uploadedAt: string;
  }[];
}

export interface SortDetail {
  property: string;
  direction: string;
}

export interface PaginatedResponse {
  content: DigitalDocument[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  sortDetails: SortDetail[];
}

export interface ApiResponse {
  code: number;
  success: boolean;
  message: string;
  data: PaginatedResponse;
}

export interface DocumentUrlResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    url: string;
  };
}

export const digitalService = {
  getUserDigitalBooks: async () => {
    const response = await api.get<ApiResponse>(getApiUrl('/api/v1/digital-documents/user/access'));
    return response.data;
  },

  getDocumentUrl: async (filePath: string) => {
    const response = await api.get<DocumentUrlResponse>(
      getApiUrl(`/api/v1/digital-documents/read?filePath=${encodeURIComponent(filePath)}`)
    );
    return response.data;
  },
};  