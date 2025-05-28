import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type MenuItem = {
  id: number;
  title: string;
  icon: 'user' | 'history' | 'heart' | 'cog' | 'question-circle';
  action: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';

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
      action: () => {},
    },
    {
      id: 3,
      title: 'Yêu thích',
      icon: 'heart',
      action: () => {},
    },
    {
      id: 4,
      title: 'Cài đặt',
      icon: 'cog',
      action: () => {},
    },
    {
      id: 5,
      title: 'Trợ giúp',
      icon: 'question-circle',
      action: () => {},
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <View style={[styles.profileImageContainer, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="user-circle" size={80} color={Colors[colorScheme].tint} />
        </View>
        <Text style={[styles.userName, { color: Colors[colorScheme].text }]}>
          Nguyễn Văn A
        </Text>
        <Text style={[styles.userEmail, { color: Colors[colorScheme].text }]}>
          nguyenvana@email.com
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>5</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách đang mượn</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>12</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách đã mượn</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>3</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách yêu thích</Text>
        </View>
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
        onPress={() => {}}
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
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
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