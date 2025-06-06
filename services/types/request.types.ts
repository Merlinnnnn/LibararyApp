export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  dob: string;
  phoneNumber: string;
  address: string;
  studentBatch: number;
  majorCode: string;
}

export interface GetBooksRequest {
  page?: number;
  size?: number;
  search?: string;
} 