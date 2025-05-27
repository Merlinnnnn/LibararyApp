import { StyleSheet, View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getNotifications, Notification, markNotificationAsRead, markAllNotificationsAsRead, EntityType, ApiResponse } from '../services/notification/notificationService';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import axios from 'axios';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() || 'light';
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNumber: number = 0, shouldRefresh: boolean = false) => {
    try {
      const response = await getNotifications(pageNumber);
      if (response.success) {
        setNotifications(prev => 
          shouldRefresh ? response.data.content : [...prev, ...response.data.content]
        );
        setHasMore(!response.data.last);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(0, true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes('mượn sách')) return 'book';
    if (title.includes('phạt')) return 'exclamation-circle';
    if (title.includes('trả')) return 'check-circle';
    if (title.includes('hủy')) return 'times-circle';
    return 'bell';
  };

  const getNotificationColor = (title: string) => {
    if (title.includes('mượn sách')) return '#4CAF50';
    if (title.includes('phạt')) return '#FF0000';
    if (title.includes('trả')) return '#4CAF50';
    if (title.includes('hủy')) return '#FFA500';
    return Colors[colorScheme].tint;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEntityNavigation = (entityType: EntityType, entityId: string | null) => {
    if (!entityType) {
      Alert.alert(
        'Thông báo',
        'Liên kết không tồn tại.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!entityId) {
      Alert.alert(
        'Thông báo',
        'Liên kết không tồn tại hoặc đã bị lỗi.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('Navigating with:', { entityType, entityId });
      
      switch (entityType) {
        case 'LOAN':
          console.log('Navigating to loan:', `/loan/${entityId}`);
          router.push(`/loan/${entityId}`);
          break;
        case 'BOOK':
          console.log('Navigating to book:', `/book/${entityId}`);
          router.push(`/book/${entityId}`);
          break;
        case 'USER':
          console.log('Navigating to profile:', `/profile/${entityId}`);
          router.push(`/profile/${entityId}`);
          break;
        default:
          console.log('Invalid entity type:', entityType);
          Alert.alert(
            'Thông báo',
            'Liên kết không tồn tại hoặc đã bị lỗi.',
            [{ text: 'OK' }]
          );
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Thông báo',
        'Liên kết không tồn tại hoặc đã bị lỗi.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      console.log('Notification pressed:', notification);
      
      // Chuyển hướng ngay lập tức
      handleEntityNavigation(notification.entityType, notification.entityId);

      // Gửi API đánh dấu đã đọc ở background
      if (notification.status === 'UNREAD') {
        // Cập nhật UI ngay lập tức
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, status: 'READ' } : n
          )
        );
        
        // Gửi API ở background
        markNotificationAsRead(notification.id).catch(error => {
          console.error('Error marking notification as read:', error);
          // Nếu API thất bại, revert lại trạng thái UI
          setNotifications(prev =>
            prev.map(n =>
              n.id === notification.id ? { ...n, status: 'UNREAD' } : n
            )
          );
        });
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      Alert.alert(
        'Thông báo',
        'Liên kết không tồn tại hoặc đã bị lỗi.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.success) {
        // Cập nhật UI để đánh dấu tất cả thông báo là đã đọc
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            status: 'READ'
          }))
        );
        Alert.alert('Thành công', response.message);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể đánh dấu tất cả thông báo là đã đọc. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả thông báo là đã đọc. Vui lòng thử lại sau.');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Thông báo',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                padding: 12,
                marginLeft: 8,
                borderRadius: 8,
                backgroundColor: Colors[colorScheme].background === '#FFFFFF' 
                  ? 'rgba(0,0,0,0.05)' 
                  : 'rgba(255,255,255,0.1)',
              }}
              activeOpacity={0.6}
            >
              <FontAwesome 
                name="arrow-left" 
                size={22} 
                color={Colors[colorScheme].tint} 
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Xác nhận',
                  'Bạn có muốn đánh dấu tất cả thông báo là đã đọc?',
                  [
                    {
                      text: 'Hủy',
                      style: 'cancel'
                    },
                    {
                      text: 'Đồng ý',
                      onPress: handleMarkAllAsRead
                    }
                  ]
                );
              }}
              style={{
                padding: 12,
                marginRight: 8,
                borderRadius: 8,
                backgroundColor: Colors[colorScheme].background === '#FFFFFF' 
                  ? 'rgba(0,0,0,0.05)' 
                  : 'rgba(255,255,255,0.1)',
              }}
              activeOpacity={0.6}
            >
              <FontAwesome 
                name="check-square" 
                size={22} 
                color={Colors[colorScheme].tint} 
              />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors[colorScheme].tint]}
            tintColor={Colors[colorScheme].tint}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            onEndReached();
          }
        }}
        scrollEventThrottle={400}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
              Không có thông báo nào
            </Text>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <TouchableOpacity
              key={`${notification.id}-${index}`}
              style={[
                styles.notificationCard,
                { 
                  backgroundColor: Colors[colorScheme].background,
                  opacity: notification.status === 'READ' ? 0.8 : 1,
                  transform: [{ scale: notification.status === 'READ' ? 0.98 : 1 }]
                }
              ]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.notificationIcon,
                { backgroundColor: `${getNotificationColor(notification.title)}15` }
              ]}>
                <FontAwesome 
                  name={getNotificationIcon(notification.title)} 
                  size={24} 
                  color={getNotificationColor(notification.title)} 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[
                  styles.notificationTitle, 
                  { 
                    color: Colors[colorScheme].text,
                    fontWeight: notification.status === 'UNREAD' ? '700' : '600'
                  }
                ]}>
                  {notification.title}
                </Text>
                <Text style={[
                  styles.notificationMessage, 
                  { color: Colors[colorScheme].text }
                ]}>
                  {notification.content}
                </Text>
                <Text style={[
                  styles.notificationDate, 
                  { color: Colors[colorScheme].text }
                ]}>
                  {formatDate(notification.createdAt)}
                </Text>
              </View>
              {notification.status === 'UNREAD' && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
        )}

        {hasMore && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 6,
  },
  notificationDate: {
    fontSize: 12,
    opacity: 0.6,
    letterSpacing: 0.2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    position: 'absolute',
    top: 16,
    right: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
}); 