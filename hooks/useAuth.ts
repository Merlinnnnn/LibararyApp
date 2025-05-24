import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { authService } from '@/services/auth/auth.service';
import { LoginRequest } from '@/services/types/auth.types';

// Interface cho payload của JWT
interface JwtPayload {
  fullname: string;
  email: string;
  [key: string]: any;
}

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<{ fullname: string; email: string }>({
    fullname: '',
    email: '',
  });
  const router = useRouter();

  // Kiểm tra trạng thái đăng nhập khi app khởi động
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Theo dõi trạng thái của app
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        timeout = setTimeout(async () => {
          await logout();
        }, 5 * 60 * 1000); // 5 phút
      } else if (nextAppState === 'active') {
        if (timeout) clearTimeout(timeout);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setIsLoggedIn(true);
        decodeToken(token);
      }
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái đăng nhập:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const decodeToken = (token: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      setUserInfo({
        fullname: decoded.fullname || '',
        email: decoded.email || '',
      });
    } catch (error) {
      console.error('Lỗi giải mã token:', error);
      logout(); // Đăng xuất nếu token không hợp lệ
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const loginData: LoginRequest = { username, password };
      const { data, success, message } = await authService.login(loginData);
      
      // if (__DEV__) {
      //   console.log('[Login Response]', {
      //     data,
      //     success,
      //     message
      //   });
      // }

      if (!success || !data?.token) {
        throw new Error(message || 'Đăng nhập thất bại');
      }

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.userInfo));
      decodeToken(data.token);
      setIsLoggedIn(true);
      router.replace('/(tabs)');
    } catch (error: any) {
      // if (__DEV__) {
      //   console.error('[Login Error]', error);
      // }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const registerData: LoginRequest = { username: email, password };
      const response = await authService.register(registerData);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Gửi yêu cầu quên mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Lỗi quên mật khẩu:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      const response = await authService.resetPassword(token, newPassword);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setIsLoggedIn(false);
      setUserInfo({ fullname: '', email: '' });
      router.replace('/login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  return {
    isLoggedIn,
    isLoading,
    userInfo,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
  };
};
