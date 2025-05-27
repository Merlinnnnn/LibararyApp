// User types
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Book types
export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  cover: string;
  category: string;
  isAvailable: boolean;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  description?: string;
}

// Borrow types
export interface BorrowedBook {
  id: number;
  book: Book;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Request types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface GetBooksRequest {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export interface Document {
  documentId: number;
  isbn: string | null;
  documentName: string;
  author: string;
  publisher: string;
  publishedDate: string | null;
  language: string | null;
  price: number;
  quantity: number;
  description: string;
  coverImage: string;
  documentCategory: string;
  summary: string | null;
  approvalStatus: string;
  documentTypes: DocumentType[];
  courses: Course[];
  physicalDocument: PhysicalDocument | null;
  digitalDocument: DigitalDocument | null;
}

export interface DocumentType {
  documentTypeId: number;
  typeName: string;
  description: string;
}

export interface Course {
  courseId: number;
  courseCode: string;
  courseName: string;
  description: string;
}

export interface PhysicalDocument {
  physicalDocumentId: number;
  documentName: string;
  author: string;
  publisher: string;
  description: string;
  coverImage: string;
  isbn: string;
  quantity: number;
  borrowedCount: number;
  unavailableCount: number;
  availableCopies: number;
}

export interface DigitalDocument {
  digitalDocumentId: number;
  documentName: string;
  author: string;
  publisher: string;
  description: string;
  coverImage: string;
  visibilityStatus: string;
  uploads: Upload[];
}

export interface Upload {
  uploadId: number;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedAt: string;
} 