import api from '../config/axios';
import { getApiUrl } from '../config/api.config';
import { APIError } from '../types/common.types';
import { PageDTO } from '../types/common.types';
export enum LoanStatus {
  RESERVED = 'RESERVED',
  BORROWED = 'BORROWED',
  RETURNED = 'RETURNED',
  CANCELLED_AUTO = 'CANCELLED_AUTO'
}

export enum ReturnCondition {
  NORMAL = 'NORMAL',
  DAMAGED = 'DAMAGED',
  OVERDUE = 'OVERDUE'
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  CASH = 'CASH',
  NON_PAYMENT = 'NON_PAYMENT'
}

export interface LoanRequest {
  physicalDocId: number;  // Tài liệu cần mượn
}

export interface LoanResponse {
  transactionId: number;
  documentId: string;
  physicalDocId: number;
  documentName: string;
  username: string;
  librarianName: string | null;
  loanDate: string;  // ISO date string
  dueDate: string;   // ISO date string
  returnDate: string | null;  // ISO date string
  status: LoanStatus;
  returnCondition: ReturnCondition | null;
  fineAmount?: number;
  paymentStatus?: PaymentStatus;
  paidAt?: string;  // ISO date string
}

class LoanService {
  private handleError(error: any): APIError {
    if (error.response?.data) {
      const { code, message, success, data } = error.response.data;
      return {
        code: code || 500,
        success: success || false,
        message: message || 'Có lỗi xảy ra',
        data: null
      };
    }
    return {
      code: 500,
      success: false,
      message: 'Không thể kết nối đến server',
      data: null
    };
  }

  async createLoan(request: LoanRequest): Promise<LoanResponse> {
    try {
      const response = await api.post(getApiUrl('/api/v1/loans'), request);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getLoanById(id: number): Promise<LoanResponse> {
    try {
      const response = await api.get(getApiUrl(`/api/v1/loans/${id}`));
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getAllLoans(page: number = 0, size: number = 10): Promise<PageDTO<LoanResponse>> {
    try {
      const response = await api.get(getApiUrl('/api/v1/loans'), {
        params: { page, size }
      });
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async checkUserBorrowingDocument(physicalId: number): Promise<boolean> {
    try {
      const response = await api.get(getApiUrl(`/api/v1/loans/user/check-user-borrowing/${physicalId}`));
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserBorrowedBooks(userId: string, page: number = 0, size: number = 10): Promise<PageDTO<LoanResponse>> {
    try {
      const response = await api.get(getApiUrl('/api/v1/loans/user/borrowed-books'), {
        params: { userId, page, size }
      });
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async handleBarcodeScan(action: string, token: string): Promise<LoanResponse> {
    try {
      const response = await api.get(getApiUrl('/api/v1/loans/scan'), {
        params: { action, token }
      });
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getQRCodeImage(transactionId: number): Promise<string> {
    try {
      const response = await api.get(getApiUrl(`/api/v1/loans/${transactionId}/qrcode-image`), {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'image/png'
        }
      });

      // Chuyển đổi arraybuffer thành base64 trên React Native
      const bytes = new Uint8Array(response.data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      return `data:image/png;base64,${base64}`;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createFineForDamagedOrLostBook(loanId: number): Promise<LoanResponse> {
    try {
      const response = await api.post(getApiUrl(`/api/v1/loans/${loanId}/fine`));
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async processCashPayment(loanId: number): Promise<LoanResponse> {
    try {
      const response = await api.post(getApiUrl(`/api/v1/loans/${loanId}/payment/cash`));
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  static async getLoanDetail(loanId: number): Promise<LoanResponse> {
    try {
      const response = await api.get(getApiUrl(`/api/v1/loan/${loanId}`));
      return response.data.data;
    } catch (error) {
      console.error('Error fetching loan detail:', error);
      throw error;
    }
  }
}

export const loanService = new LoanService(); 