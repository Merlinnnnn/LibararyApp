import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useAuth } from '../hooks/useAuth';
import { setRouter } from '../services/navigationService';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setRouter(router);
  }, [router]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Màn hình Login */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        
        {/* Màn hình Quên mật khẩu */}
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />

        {/* Màn hình Đăng ký */}
        <Stack.Screen name="register" options={{ headerShown: false }} />
        
        {/* Giao diện chính */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Màn hình lỗi 404 */}
        <Stack.Screen name="+not-found" />

        {/* Màn hình chi tiết khoản vay */}
        <Stack.Screen
          name="loan/[id]"
          options={{
            title: 'Loan Details',
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
