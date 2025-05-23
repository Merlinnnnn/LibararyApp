import { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Platform,
  BackHandler,
  Alert,
  StatusBar,
  Button,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const navigation = useNavigation();

  // Xử lý sự kiện nút Back
  useEffect(() => {
    const handleBackPress = () => {
      if (!navigation.canGoBack()) {
        Alert.alert(
          '🔔 Xác nhận',
          'Bạn có muốn thoát ứng dụng không?',
          [
            {
              text: 'No',
              onPress: () => null,
              style: 'cancel',
            },
            { text: 'Yes', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // Chặn hành động mặc định
      }
      return false; // Cho phép quay lại
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
  }, [navigation]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1D3D47" />

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
            resizeMode="cover"
          />
        }>
         
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome! 👋</ThemedText>
          <HelloWave />
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 1: Try it</ThemedText>
          <ThemedText>
            Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see
            changes. Press{' '}
            <ThemedText type="defaultSemiBold">
              {Platform.select({
                ios: 'cmd + d',
                android: 'cmd + m',
                web: 'F12',
              })}
            </ThemedText>{' '}
            to open developer tools.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          <ThemedText>
            Tap the Explore tab to learn more about what's included in this starter app.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
          <ThemedText>
            When you're ready, run{' '}
            <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
            <ThemedText type="defaultSemiBold">app</ThemedText> directory.
          </ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16, // Tăng khoảng cách
  },
  stepContainer: {
    gap: 8,
    marginBottom: 20, // Tăng khoảng cách giữa các bước
  },
  reactLogo: {
    height: 200,
    width: '100%', // Phủ toàn màn hình ngang
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});
