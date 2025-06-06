import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { userService } from '../../services/user/user.service';
import { UserDetail } from '../../services/types/user.types';

type MenuItem = {
  id: number;
  title: string;
  icon: 'user' | 'history' | 'heart' | 'cog' | 'question-circle' | 'upload';
  action: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserInfo();
      if (response.data && response.data.success && response.data.data) {
        setUserDetail(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 1,
      title: 'Thông tin cá nhân',
      icon: 'user',
      action: () => router.push('/user-info'),
    },
    {
      id: 2,
      title: 'Lịch sử mượn sách',
      icon: 'history',
      action: () => router.push('/access-history' as any),
    },
    {
      id: 3,
      title: 'Yêu thích',
      icon: 'heart',
      action: () => router.push('/favorites'),
    },
    {
      id: 4,
      title: 'Tài liệu đã tải lên',
      icon: 'upload',
      action: () => router.push('/uploaded-documents' as any),
    },
    {
      id: 5,
      title: 'Cài đặt',
      icon: 'cog',
      action: () => {},
    },
    {
      id: 6,
      title: 'Trợ giúp',
      icon: 'question-circle',
      action: () => {},
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <View style={[styles.profileImageContainer, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="user-circle" size={80} color={Colors[colorScheme].tint} />
        </View>
        <Text style={[styles.userName, { color: Colors[colorScheme].text }]}>
          {userDetail ? `${userDetail.firstName} ${userDetail.lastName}` : 'Chưa có thông tin'}
        </Text>
        <Text style={[styles.userEmail, { color: Colors[colorScheme].text }]}>
          {userDetail?.username || 'Chưa có email'}
        </Text>
        {userDetail?.isActive && (
          <View style={[styles.statusBadge, { backgroundColor: userDetail.isActive === 'ACTIVE' ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>
              {userDetail.isActive === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme].background }]}
            onPress={item.action}
          >
            <View style={styles.menuItemLeft}>
              <FontAwesome name={item.icon} size={20} color={Colors[colorScheme].tint} />
              <Text style={[styles.menuItemText, { color: Colors[colorScheme].text }]}>
                {item.title}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors[colorScheme].icon} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: Colors[colorScheme].tint }]}
        onPress={logout}
      >
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
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
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 