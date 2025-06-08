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
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme() || 'light';
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
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerBackTitle: 'Quay lại',
          headerTitleAlign: 'center',
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Cài đặt',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            title: 'Trợ giúp',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="user-info"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="access-history"
          options={{
            title: 'Lịch sử mượn sách',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            title: 'Yêu thích',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="uploaded-documents"
          options={{
            title: 'Tài liệu đã tải lên',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: 'Đăng ký',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: 'Quên mật khẩu',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="change-password"
          options={{
            title: 'Đổi mật khẩu',
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
