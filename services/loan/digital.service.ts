import api from '../config/axios';
import { getApiUrl } from '../config/api.config';

export interface DigitalDocument {
  digitalDocumentId: number;
  documentName: string;
  author: string;
  publisher: string;
  description: string;
  coverImage: string | null;
  visibilityStatus: string;
  uploads: {
    uploadId: number;
    fileName: string;
    fileType: string;
    filePath: string;
    uploadedAt: string;
  }[];
}

export interface ApiResponse {
  code: number;
  success: boolean;
  message: string;
  data: DigitalDocument[];
}

export const digitalService = {
  getUserDigitalBooks: async () => {
    const response = await api.get<ApiResponse>(getApiUrl('/api/v1/digital-documents/user/access'));
    return response.data;
  },
};  