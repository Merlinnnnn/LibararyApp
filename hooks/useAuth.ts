import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {jwtDecode} from 'jwt-decode';

// Interface cho payload của JWT
interface JwtPayload {
  fullname: string;
  [key: string]: any; // Để chấp nhận các thuộc tính khác nếu có
}

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fullname, setFullname] = useState<string>('');
  const router = useRouter();
  const API_URL = 'http://192.168.1.138:8009/api/v1/auth/login';

  // Kiểm tra trạng thái đăng nhập khi app khởi động
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setIsLoggedIn(true);
        decodeToken(token);
      }
      setIsLoading(false);
    };
    checkLoginStatus();
  }, []);
  useEffect(() => {
    console.log('fullname: ',fullname);
  }, [fullname]);

  // Giải mã token và lấy fullname
  const decodeToken = (token: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      console.log('Decoded Token:', decoded);
      if (decoded.fullName) {
        setFullname(decoded.fullName);
        console.log(decoded.fullName);
      }
    } catch (error) {
      console.error('Lỗi giải mã token:', error);
    }
  };

  // Xử lý đăng nhập bằng API
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Sai tên đăng nhập hoặc mật khẩu!');
      }

      const data = await response.json();
      const token = data?.result?.token;
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        decodeToken(token); // Giải mã token
        setIsLoggedIn(true);
        router.replace('/(tabs)');
      } else {
        throw new Error('Phản hồi không chứa token!');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      alert('Lỗi đăng nhập. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng xuất
  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/login');
    setIsLoggedIn(false);
    setFullname('');
  };

  // Tự động đăng xuất khi app vào background
// Theo dõi trạng thái của app
useEffect(() => {
  let timeout: NodeJS.Timeout;

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // Khi app chuyển sang chạy nền, bắt đầu tính thời gian
    if (nextAppState === 'background') {
      timeout = setTimeout(async () => {
        await logout(); // Tự động logout sau 5 phút ở chế độ nền
      }, 5 * 60 * 1000); // 5 phút
    } else if (nextAppState === 'active') {
      // Khi quay lại app, xóa thời gian chờ
      if (timeout) clearTimeout(timeout);
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => {
    subscription.remove();
    if (timeout) clearTimeout(timeout); // Xóa khi component unmount
  };
}, []);

  return { isLoggedIn, isLoading, fullname, login, logout };
};
