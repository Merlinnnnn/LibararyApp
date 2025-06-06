import api from '../config/axios';
import { getApiUrl } from '../config/api.config';
import { Document, DocumentFilterParams, PageResponse, DocumentType, DocumentTypeResponse, ApiResponse } from '../types/book.types';

export interface AccessRequest {
  id: number;
  coverImage: string | null;
  digitalId: number;
  requesterId: string;
  ownerId: string;
  requesterName: string;
  ownerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestTime: string;
  decisionTime: string | null;
  reviewerId: string | null;
  licenseExpiry: string | null;
}

export interface AccessRequestResponse {
  digitalId: number;
  totalBorrowers: number;
  borrowers: AccessRequest[];
}

export interface PhysicalBorrowRequest {
  id: number;
  coverImage: string;
  physicalDocId: number;
  requesterId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestTime: string;
  decisionTime: string | null;
  reviewerId: string | null;
  returnTime: string | null;
}

export interface PhysicalBorrowResponse {
  content: PhysicalBorrowRequest[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  sortDetails: {
    property: string;
    direction: string;
  }[];
}

export interface PhysicalBook {
  transactionId: number;
  documentId: string;
  physicalDocId: number;
  documentName: string;
  username: string;
  librarianId: string | null;
  loanDate: string;
  dueDate: string | null;
  returnDate: string | null;
  status: 'RESERVED' | 'BORROWED' | 'RETURNED' | 'OVERDUE';
  returnCondition: string | null;
  fineAmount: number;
  paymentStatus: 'NON_PAYMENT' | 'PAID' | 'PARTIALLY_PAID';
  paidAt: string | null;
}

export interface PhysicalBookResponse {
  content: PhysicalBook[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  sortDetails: {
    property: string;
    direction: string;
  }[];
}

export interface UserDocumentStats {
  borrowedTotal: number;
  borrowedCurr: number;
  favorTotal: number;
}

export interface UploadedFile {
  uploadId: number;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedAt: string;
}

export interface DigitalDocument {
  digitalDocumentId: number;
  documentName: string;
  author: string;
  publisher: string;
  description: string;
  coverImage: string | null;
  approvalStatus: 'APPROVED_BY_AI' | 'PENDING' | 'REJECTED';
  visibilityStatus: 'RESTRICTED_VIEW' | 'PUBLIC';
  uploads: UploadedFile[];
}

export interface DocumentResponse {
  content: DigitalDocument[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  sortDetails: {
    property: string;
    direction: string;
  }[];
}

export const documentService = {
  async filterDocuments(params: DocumentFilterParams): Promise<PageResponse<Document>> {
    try {
      // Convert params to match Spring Boot's expected format
      const queryParams = new URLSearchParams();
      
      // Handle array parameters (documentTypeIds, courseIds)
      if (params.documentTypeIds) {
        params.documentTypeIds.forEach(id => {
          queryParams.append('documentTypeIds', id.toString());
        });
      }
      
      if (params.courseIds) {
        params.courseIds.forEach(id => {
          queryParams.append('courseIds', id.toString());
        });
      }

      // Handle other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (key !== 'documentTypeIds' && key !== 'courseIds' && value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`${getApiUrl('/api/v1/documents/filter')}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error filtering documents:', error);
      throw error;
    }
  },

  async searchByTitle(title: string): Promise<Document | null> {
    try {
      const response = await api.get(getApiUrl('/api/v1/documents/search'), {
        params: { title }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching document:', error);
      throw error;
    }
  },

  async getDocumentTypes(): Promise<DocumentType[]> {
    try {
      const response = await api.get<DocumentTypeResponse>(getApiUrl('/api/v1/document-types'));
      if (response.data.success) {
        return response.data.data.content;
      }
      throw new Error(response.data.message);
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw error;
    }
  },

  async getBookById(id: number): Promise<ApiResponse<Document>> {
    try {
      const response = await api.get<ApiResponse<Document>>(getApiUrl(`/api/v1/documents/${id}`));
      return response.data;
    } catch (error) {
      console.error('Error fetching book by ID:', error);
      throw error;
    }
  },

  async borrowPhysicalDocument(physicalDocumentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(getApiUrl('/api/v1/loans'), {
        physicalDocId: physicalDocumentId
      });
      return response.data;
    } catch (error) {
     // console.error('Error borrowing physical document:', error);
      throw error;
    }
  },

  async borrowDigitalDocument(digitalDocumentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(getApiUrl('/api/v1/access-requests'), {
        digitalId: digitalDocumentId
      });
      return response.data;
    } catch (error) {
        throw error;
    }
  },

  async getUserAccessHistory(userId: string): Promise<ApiResponse<AccessRequestResponse>> {
    try {
      const response = await api.get<ApiResponse<AccessRequestResponse>>(
        getApiUrl(`/api/v1/access-requests/user?userId=${userId}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user access history:', error);
      throw error;
    }
  },

  async getUserPhysicalBorrowHistory(userId: string): Promise<ApiResponse<PhysicalBorrowResponse>> {
    try {
      const response = await api.get<ApiResponse<PhysicalBorrowResponse>>(
        getApiUrl(`/api/v1/loans/user?userId=${userId}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user physical borrow history:', error);
      throw error;
    }
  },

  async getUserPhysicalBooks(userId: string): Promise<ApiResponse<PhysicalBookResponse>> {
    try {
      const response = await api.get<ApiResponse<PhysicalBookResponse>>(
        getApiUrl(`/api/v1/loans/user/borrowed-books?userId=${userId}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user physical books:', error);
      throw error;
    }
  },

  async getUserDocumentStats(): Promise<ApiResponse<UserDocumentStats>> {
    try {
      const response = await api.get<ApiResponse<UserDocumentStats>>(getApiUrl('/api/v1/documents/user/1fcb671e-e261-4ddd-b617-23d0fcf40bf5'));
      return response.data;
    } catch (error) {
      console.error('Error fetching user document stats:', error);
      throw error;
    }
  },

  async getUserUploadedDocuments(userId: string): Promise<ApiResponse<DocumentResponse>> {
    try {
      const response = await api.get<ApiResponse<DocumentResponse>>(
        getApiUrl(`/api/v1/digital-documents/users/${userId}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user uploaded documents:', error);
      throw error;
    }
  },

  async getAccessRequests(digitalId: number): Promise<ApiResponse<AccessRequestResponse>> {
    try {
      const response = await api.get<ApiResponse<AccessRequestResponse>>(
        getApiUrl(`/api/v1/access-requests/digital/${digitalId}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching document access requests:', error);
      throw error;
    }
  },

  async updateAccessRequest(requestId: number, status: 'APPROVED' | 'REJECTED'): Promise<ApiResponse<any>> {
    try {
      const response = await api.put<ApiResponse<any>>(
        getApiUrl(`/api/v1/digital/${requestId}`),
        { status }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating access request:', error);
      throw error;
    }
  },

  async approveDigitalDocument(requestId: number): Promise<ApiResponse<string>> {
    try {
      const response = await api.post<ApiResponse<string>>(
        getApiUrl(`/api/v1/access-requests/${requestId}/approve`)
      );
      return response.data;
    } catch (error) {
      console.error('Error approving digital document:', error);
      throw error;
    }
  },

  async rejectDigitalDocument(requestId: number, message?: string): Promise<ApiResponse<string>> {
    try {
      const response = await api.post<ApiResponse<string>>(
        getApiUrl(`/api/v1/access-requests/${requestId}/reject`),
        null,
        {
          params: message ? { message } : undefined
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting digital document:', error);
      throw error;
    }
  }
}; 