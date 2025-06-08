// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://3c67-2405-4802-8014-5cf0-7014-aec2-be46-c0d6.ngrok-free.app',
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