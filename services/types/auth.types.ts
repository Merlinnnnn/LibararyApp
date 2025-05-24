import { APIResponse } from './common.types';
import { User } from './user.types';

export interface UserInfo {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
}

export interface LoginData {
  token: string;
  userInfo: UserInfo;
}

export type LoginResponse = APIResponse<LoginData>;
export type AuthResponse = APIResponse<null>;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
} 