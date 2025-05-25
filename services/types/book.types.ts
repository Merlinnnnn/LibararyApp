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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export enum DocumentCategory {
  PHYSICAL = 'PHYSICAL',  // Tài liệu vật lý
  DIGITAL = 'DIGITAL',    // Tài liệu điện tử
  BOTH = 'BOTH'          // Cả hai loại
}

export enum VisibilityStatus {
  PUBLIC = 'PUBLIC',           // Tài liệu công khai cho tất cả người dùng
  RESTRICTED_VIEW = 'RESTRICTED_VIEW'  // Tài liệu chỉ được xem bởi người khác nếu được chủ sở hữu hoặc hệ thống phê duyệt
}

export enum DocumentStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  UNAVAILABLE = 'UNAVAILABLE'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
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
  visibilityStatus: VisibilityStatus;
  uploads: {
    uploadId: number;
    fileName: string;
    fileType: string;
    filePath: string;
    uploadedAt: string;
  }[];
}

export interface Document {
  documentId: number;
  isbn: string;
  documentName: string;
  author: string;
  publisher: string;
  publishedDate: string;
  language: string | null;
  price: number;
  quantity: number;
  description: string;
  coverImage: string;
  documentCategory: DocumentCategory;
  summary: string;
  approvalStatus: ApprovalStatus;
  documentTypes: DocumentType[];
  courses: Course[];
  physicalDocument: PhysicalDocument;
  digitalDocument: DigitalDocument;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface DocumentFilterParams {
  documentName?: string;
  author?: string;
  publisher?: string;
  language?: string;
  courseIds?: number[];
  documentTypeIds?: number[];
  documentCategory?: DocumentCategory;
  status?: DocumentStatus;
  approvalStatus?: ApprovalStatus;
  publishedDateFrom?: string;
  publishedDateTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DocumentTypeResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    content: DocumentType[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    sortDetails: any[];
  };
}

export interface ApiResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
} 