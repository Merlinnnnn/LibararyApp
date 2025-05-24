// Error handling
export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function để xử lý API response
export const handleAPIResponse = async (promise: Promise<any>) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new APIError(
        error.response.status,
        error.response.data.message || 'Có lỗi xảy ra',
        error.response.data
      );
    }
    throw new APIError(500, 'Không thể kết nối đến server');
  }
}; 