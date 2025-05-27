import api from '../config/axios';
import { Document } from '../types';
import { getApiUrl } from '../config/api.config';

export interface RecommendationResponse {
  code: number;
  success: boolean;
  data: {
    content: Document[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    sortDetails: any[];
  };
}

export const getRecommendedBooks = async (): Promise<Document[]> => {
  try {
    const response = await api.get<RecommendationResponse>(getApiUrl('/api/v1/recommendations/ml'));
    if (response.data.success) {
      return response.data.data.content;
    }
    return [];
  } catch (error) {
    console.error('Error fetching recommended books:', error);
    return [];
  }
};

export const getProgramRelatedBooks = async (): Promise<Document[]> => {
  try {
    const response = await api.get<RecommendationResponse>(getApiUrl('/api/v1/recommendations/program'));
    if (response.data.success) {
      return response.data.data.content;
    }
    return [];
  } catch (error) {
    console.error('Error fetching program related books:', error);
    return [];
  }
}; 