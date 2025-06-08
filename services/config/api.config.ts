// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://3920-2405-4802-8014-5cf0-89c-544f-fa1d-2c6d.ngrok-free.app',
  API_VERSION: 'v1',
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  }
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 