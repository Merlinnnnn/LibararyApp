// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://row-vote-yea-mood.trycloudflare.com',
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