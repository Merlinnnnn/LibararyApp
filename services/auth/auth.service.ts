import axios from 'axios';
import { LoginRequest, LoginResponse, AuthResponse, RegisterRequest } from '../types/auth.types';
import { APIError } from '../types/common.types';
import { getApiUrl } from '../config/api.config';

class AuthService {
  private handleError(error: any): APIError {
    if (error.response?.data) {
      const { code, message, success, data } = error.response.data;
      
      // Xử lý lỗi validation
      if (data && typeof data === 'object') {
        const validationError = Object.values(data)[0];
        if (typeof validationError === 'string') {
          return {
            code: code || 500,
            success: success || false,
            message: validationError,
            data: null
          };
        }
      }

      return {
        code: code || 500,
        success: success || false,
        message: message || 'Có lỗi xảy ra',
        data: null
      };
    }
    
    // Lỗi kết nối
    return {
      code: 500,
      success: false,
      message: 'Không thể kết nối đến server',
      data: null
    };
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(getApiUrl('/api/v1/auth/login'), data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(getApiUrl('/api/v1/auth/register'), data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        getApiUrl('/api/v1/auth/request-password-reset'),
        { email }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(getApiUrl('/auth/reset-password'), { token, newPassword });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(getApiUrl('/api/v1/auth/verify-email'), { token });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await axios.post(getApiUrl('/api/v1/auth/introspect'), { token });
      const { success, code } = response.data;
      
      // Token is valid only if success is true and there's no error code
      return success === true && code !== 10004;
    } catch (error: any) {
      // If there's an error response with code 10004, token is invalid
      if (error.response?.data?.code === 10004) {
        return false;
      }
      // For other errors (network, server errors), we'll consider token as invalid
      return false;
    }
  }

  async resendVerificationEmail(email: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(getApiUrl('/auth/resend-verification'), { email });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
}

export const authService = new AuthService(); 