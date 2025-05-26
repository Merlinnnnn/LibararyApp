import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './api.config';
import { navigateToLogin } from '../navigationService';

// Tạo instance axios với base URL
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Interceptor để thêm token vào header
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('token', token);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        // await AsyncStorage.removeItem('userToken');
        // await AsyncStorage.removeItem('userInfo');
        // navigateToLogin();
      } catch (e) {
        console.error('Error removing token:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 