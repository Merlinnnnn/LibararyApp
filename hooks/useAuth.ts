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
  userId: string;
  exp: number;  // JWT expiration timestamp
  [key: string]: any;
}

interface UserInfo {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
}

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userId: '',
    username: '',
    firstName: '',
    lastName: '',
    fullName: '',
    roles: []
  });
  const router = useRouter();

  // Kiểm tra trạng thái đăng nhập khi app khởi động
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  };

  // Theo dõi trạng thái của app
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (timeout) clearTimeout(timeout);
        const token = await AsyncStorage.getItem('userToken');
        if (token && isTokenExpired(token)) {
          const isValid = await authService.validateToken(token);
          if (!isValid) {
            await logout();
            router.replace('/login');
          }
        }
      } else if (nextAppState === 'background') {
        timeout = setTimeout(async () => {
          await logout();
        }, 5 * 60 * 1000); // 5 phút
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
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      
      if (token && storedUserInfo) {
        if (isTokenExpired(token)) {
          const isValid = await authService.validateToken(token);
          if (!isValid) {
            await logout();
            router.replace('/login');
            return;
          }
        }
        setIsLoggedIn(true);
        setUserInfo(JSON.parse(storedUserInfo));
      }
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái đăng nhập:', error);
      await logout();
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const decodeToken = (token: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      // Get user info from storage instead of token
      AsyncStorage.getItem('userInfo').then(storedInfo => {
        if (storedInfo) {
          const parsedInfo: UserInfo = JSON.parse(storedInfo);
          setUserInfo(parsedInfo);
        }
      });
    } catch (error) {
      console.error('Lỗi giải mã token:', error);
      logout();
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const loginData: LoginRequest = { username, password };
      const { data, success, message } = await authService.login(loginData);
      
      if (!success || !data?.token) {
        throw new Error(message || 'Đăng nhập thất bại');
      }

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.userInfo));
      setUserInfo(data.userInfo);
      setIsLoggedIn(true);
      router.replace('/(tabs)');
    } catch (error: any) {
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
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('@drm_private_key');
      await AsyncStorage.removeItem('@drm_public_key');
      await AsyncStorage.clear();
      setIsLoggedIn(false);
      setUserInfo({
        userId: '',
        username: '',
        firstName: '',
        lastName: '',
        fullName: '',
        roles: []
      });
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
