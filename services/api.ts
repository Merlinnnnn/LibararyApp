import axios from 'axios';
import { API_URL } from './config';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// Book APIs
export const bookAPI = {
  // Lấy danh sách sách
  getBooks: (params?: { 
    page?: number; 
    limit?: number; 
    category?: string;
    search?: string;
  }) => api.get('/books', { params }),
  
  // Lấy chi tiết sách
  getBookById: (id: number) => 
    api.get(`/books/${id}`),
  
  // Lấy danh mục sách
  getCategories: () => 
    api.get('/categories'),
  
  // Mượn sách
  borrowBook: (bookId: number) =>
    api.post('/books/borrow', { bookId }),
  
  // Trả sách
  returnBook: (bookId: number) =>
    api.post('/books/return', { bookId }),
  
  // Theo dõi sách
  followBook: (bookId: number) =>
    api.post('/books/follow', { bookId }),
  
  // Bỏ theo dõi sách
  unfollowBook: (bookId: number) =>
    api.post('/books/unfollow', { bookId }),
};

// User APIs
export const userAPI = {
  // Lấy thông tin user
  getProfile: () => 
    api.get('/user/profile'),
  
  // Cập nhật thông tin user
  updateProfile: (data: {
    fullName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) => api.put('/user/profile', data),
  
  // Lấy danh sách sách đã mượn
  getBorrowedBooks: () => 
    api.get('/user/borrowed-books'),
  
  // Lấy danh sách sách đang theo dõi
  getFollowedBooks: () => 
    api.get('/user/followed-books'),
};

// Error handling
export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function để xử lý API response
export const handleAPIResponse = async (promise: Promise<any>) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new APIError(
        error.response.status,
        error.response.data.message || 'Có lỗi xảy ra',
        error.response.data
      );
    }
    throw new APIError(500, 'Không thể kết nối đến server');
  }
}; 