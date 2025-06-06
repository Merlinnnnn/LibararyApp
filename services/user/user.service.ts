import api from '../config/axios';
import { User, BorrowedBook, UserDetail } from '../types/user.types';
import { UpdateProfileRequest } from '../types/request.types';
import { getApiUrl } from '../config/api.config';
import { APIResponse } from '../types/common.types';

// Assuming you have a way to get the user's authentication token
// import { getAuthToken } from '../auth/auth.utils'; // Replace with your actual token retrieval logic

interface GetUserDetailResponse extends APIResponse<UserDetail> { }

export const userService = {
  // Lấy thông tin user cũ (có thể refactor sau)
  getProfile: () =>
    api.get<User>('/user/profile'),

  // Cập nhật thông tin user
  updateProfile: (userId: string, data: UpdateProfileRequest) =>
    api.put<APIResponse<UserDetail>>(`/api/v1/users/${userId}`, data),

  // Lấy danh sách sách đã mượn
  getBorrowedBooks: () =>
    api.get<BorrowedBook[]>('/user/borrowed-books'),

  // Lấy danh sách sách đang theo dõi
  getFollowedBooks: () =>
    api.get<BorrowedBook[]>('/user/followed-books'),

  getUserInfo: () =>
    api.get<GetUserDetailResponse>('/api/v1/users/info'),
}; 