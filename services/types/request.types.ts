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