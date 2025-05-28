import { Book } from './book.types';
import { APIResponse } from './common.types';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
}

export interface UserDetail {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  dob: string | null;
  phoneNumber: string;
  address: string;
  avatar?: string | null;
  registrationDate: string;
  expirationDate: string | null;
  currentBorrowedCount: number;
  maxBorrowLimit: number;
  roles: string[];
  studentBatch: number;
  isActive: string;
  lockedAt: string | null;
}

export interface BorrowedBook {
  id: number;
  book: Book;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
} 