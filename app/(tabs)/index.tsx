import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

export default function HomeScreen() {
  const colorScheme = useColorScheme() || 'light';

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: Colors[colorScheme].text }]}>
          Xin chào, Nguyễn Văn A
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
          Chào mừng đến với Thư viện
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="book" size={24} color={Colors[colorScheme].tint} />
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>5</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách đang mượn</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="history" size={24} color={Colors[colorScheme].tint} />
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>12</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách đã mượn</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="clock-o" size={24} color={Colors[colorScheme].tint} />
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>3</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Ngày còn lại</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Thông báo
        </Text>
        <View style={[styles.notificationCard, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="bell" size={20} color={Colors[colorScheme].tint} />
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: Colors[colorScheme].text }]}>
              Sách sắp đến hạn trả
            </Text>
            <Text style={[styles.notificationText, { color: Colors[colorScheme].text }]}>
              "Đắc nhân tâm" cần trả trong 2 ngày tới
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Sách mới
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newBooksContainer}>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.bookCard, { backgroundColor: Colors[colorScheme].background }]}
            >
              <View style={styles.bookCover}>
                <FontAwesome name="book" size={40} color={Colors[colorScheme].tint} />
              </View>
              <Text style={[styles.bookTitle, { color: Colors[colorScheme].text }]}>
                Sách mới {item}
              </Text>
              <Text style={[styles.bookAuthor, { color: Colors[colorScheme].text }]}>
                Tác giả {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    marginLeft: 15,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  newBooksContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  bookCard: {
    width: 150,
    marginRight: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
});
