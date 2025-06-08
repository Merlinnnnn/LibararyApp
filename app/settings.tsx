import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);

  const settingsItems = [
    {
      id: 1,
      title: 'Thông báo',
      description: 'Nhận thông báo về sách mới và cập nhật',
      icon: 'bell',
      type: 'switch',
      value: notifications,
      onValueChange: setNotifications,
    },
    {
      id: 2,
      title: 'Tự động tải xuống',
      description: 'Tự động tải sách khi có kết nối WiFi',
      icon: 'download',
      type: 'switch',
      value: autoDownload,
      onValueChange: setAutoDownload,
    },
    {
      id: 3,
      title: 'Ngôn ngữ',
      description: 'Tiếng Việt',
      icon: 'language',
      type: 'link',
      onPress: () => {},
    },
    {
      id: 4,
      title: 'Về ứng dụng',
      description: 'Phiên bản 1.0.0',
      icon: 'info-circle',
      type: 'link',
      onPress: () => {},
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme].background }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>Cài đặt</Text>
        </View>

        <View style={styles.settingsContainer}>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.settingItem, { backgroundColor: Colors[colorScheme].background }]}
              onPress={item.type === 'link' ? item.onPress : undefined}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <FontAwesome name={item.icon} size={24} color={Colors[colorScheme].tint} />
                <View style={styles.settingItemText}>
                  <Text style={[styles.settingItemTitle, { color: Colors[colorScheme].text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.settingItemDescription, { color: Colors[colorScheme].text }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              {item.type === 'switch' ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: '#767577', true: Colors[colorScheme].tint }}
                  thumbColor={item.value ? '#f4f3f4' : '#f4f3f4'}
                />
              ) : (
                <FontAwesome name="chevron-right" size={16} color={Colors[colorScheme].icon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsContainer: {
    padding: 16,
    paddingTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 72,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingItemDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 