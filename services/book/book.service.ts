import api from '../config/axios';
import { Book, Category, PaginatedResponse } from '../types/book.types';
import { GetBooksRequest } from '../types/request.types';

export const bookService = {
  // Lấy danh sách sách
  getBooks: (params?: GetBooksRequest) => 
    api.get<PaginatedResponse<Book>>('/books', { params }),
  
  // Lấy chi tiết sách
  getBookById: (id: number) => 
    api.get<Book>(`/books/${id}`),
  
  // Lấy danh mục sách
  getCategories: () => 
    api.get<Category[]>('/categories'),
  
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