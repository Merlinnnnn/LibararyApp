import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

// Mock data for borrowed books
const mockBorrowedBooks = [
  {
    id: 1,
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    borrowDate: '2024-03-01',
    dueDate: '2024-03-15',
    status: 'active',
  },
  {
    id: 2,
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    borrowDate: '2024-02-15',
    dueDate: '2024-03-01',
    status: 'overdue',
  },
  {
    id: 3,
    title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
    author: 'Nguyễn Nhật Ánh',
    borrowDate: '2024-02-01',
    dueDate: '2024-02-15',
    status: 'returned',
  },
];

export default function BorrowedScreen() {
  const colorScheme = useColorScheme() || 'light';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'overdue':
        return '#F44336';
      case 'returned':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang mượn';
      case 'overdue':
        return 'Quá hạn';
      case 'returned':
        return 'Đã trả';
      default:
        return 'Không xác định';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          Sách đã mượn
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="book" size={24} color={Colors[colorScheme].tint} />
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>2</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Đang mượn</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="exclamation-circle" size={24} color={Colors[colorScheme].tint} />
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>1</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Quá hạn</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
          <FontAwesome name="check-circle" size={24} color={Colors[colorScheme].tint} />
          <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>1</Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Đã trả</Text>
        </View>
      </View>

      <View style={styles.booksContainer}>
        {mockBorrowedBooks.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={[styles.bookCard, { backgroundColor: Colors[colorScheme].background }]}
          >
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: Colors[colorScheme].text }]}>
                {book.title}
              </Text>
              <Text style={[styles.bookAuthor, { color: Colors[colorScheme].text }]}>
                {book.author}
              </Text>
              <View style={styles.bookMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome name="calendar" size={14} color={Colors[colorScheme].icon} />
                  <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                    Mượn: {book.borrowDate}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome name="clock-o" size={14} color={Colors[colorScheme].icon} />
                  <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                    Hạn: {book.dueDate}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(book.status) }]}>
                <Text style={styles.statusText}>
                  {getStatusText(book.status)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  booksContainer: {
    padding: 20,
  },
  bookCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookInfo: {
    gap: 4,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 14,
    opacity: 0.7,
  },
  bookMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
}); 