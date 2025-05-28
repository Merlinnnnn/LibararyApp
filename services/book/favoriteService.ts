import { getApiUrl } from '../config/api.config';
import api from '../config/axios';

export interface ApiResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

class FavoriteService {
  private readonly baseUrl = '/api/v1/favorites';

  async getFavorites(page: number = 0, size: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`${getApiUrl(this.baseUrl)}?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw error;
    }
  }

  async isFavorite(documentId: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await api.get(`${getApiUrl(`/api/v1/favorites/${documentId}`)}`);
      return response.data;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      throw error;
    }
  }

  async toggleFavorite(documentId: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.post(`${getApiUrl(`/api/v1/documents/${documentId}/favorite`)}`);
      return response.data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}

export const favoriteService = new FavoriteService(); 