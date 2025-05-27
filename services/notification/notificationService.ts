import api from '../config/axios';
import { getApiUrl } from '../config/api.config';

export type EntityType = 'LOAN' | 'BOOK' | 'USER' | null;

export interface ApiResponse {
  code: number;
  success: boolean;
  message: string;
}

export interface Notification {
  id: string;
  username: string;
  title: string;
  content: string;
  entityId: string | null;
  entityType: EntityType;
  createdAt: string;
  status: 'READ' | 'UNREAD';
}

interface NotificationResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    content: Notification[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: {
        unsorted: boolean;
        sorted: boolean;
        empty: boolean;
      };
      offset: number;
      unpaged: boolean;
      paged: boolean;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    sort: {
      unsorted: boolean;
      sorted: boolean;
      empty: boolean;
    };
    numberOfElements: number;
    empty: boolean;
  };
}

interface UnreadCountResponse {
  code: number;
  success: boolean;
  message: string;
  data: number;
}

export const getNotifications = async (page: number = 0, size: number = 10): Promise<NotificationResponse> => {
  try {
    const response = await api.get<NotificationResponse>(
      getApiUrl(`/api/v1/notifications?page=${page}&size=${size}`)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await api.patch(getApiUrl(`/api/v1/notifications/${notificationId}/mark-read`));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<ApiResponse> => {
  try {
    const response = await api.patch<ApiResponse>(getApiUrl('/api/v1/notifications/mark-all-read'));
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await api.delete(getApiUrl(`/api/v1/notifications/${notificationId}`));
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const getUnreadNotificationsCount = async (): Promise<UnreadCountResponse> => {
  try {
    const response = await api.get<UnreadCountResponse>(getApiUrl('/api/v1/notifications/unread-count'));
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw error;
  }
}; 