import api from '../config/axios';
import { User, BorrowedBook } from '../types/user.types';
import { UpdateProfileRequest } from '../types/request.types';

export const userService = {
  // Lấy thông tin user
  getProfile: () => 
    api.get<User>('/user/profile'),
  
  // Cập nhật thông tin user
  updateProfile: (data: UpdateProfileRequest) => 
    api.put<User>('/user/profile', data),
  
  // Lấy danh sách sách đã mượn
  getBorrowedBooks: () => 
    api.get<BorrowedBook[]>('/user/borrowed-books'),
  
  // Lấy danh sách sách đang theo dõi
  getFollowedBooks: () => 
    api.get<BorrowedBook[]>('/user/followed-books'),
}; 