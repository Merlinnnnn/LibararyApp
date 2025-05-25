import api from '../config/axios';
import { getApiUrl } from '../config/api.config';
import { Document, DocumentFilterParams, PageResponse, DocumentType, DocumentTypeResponse, ApiResponse } from '../types/book.types';

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
      console.error('Error borrowing physical document:', error);
      throw error;
    }
  },

  async borrowDigitalDocument(digitalDocumentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(getApiUrl('/api/v1/loans'), {
        digitalDocId: digitalDocumentId
      });
      return response.data;
    } catch (error) {
      console.error('Error borrowing digital document:', error);
      throw error;
    }
  }
}; 