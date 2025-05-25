import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

// Mock data for search results
const mockSearchResults = [
  {
    id: 1,
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    category: 'Kỹ năng sống',
    available: true,
    location: 'Kệ A1',
  },
  {
    id: 2,
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    category: 'Tiểu thuyết',
    available: false,
    location: 'Kệ B2',
  },
  {
    id: 3,
    title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
    author: 'Nguyễn Nhật Ánh',
    category: 'Tiểu thuyết',
    available: true,
    location: 'Kệ C3',
  },
];

export default function SearchScreen() {
  const colorScheme = useColorScheme() || 'light';

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
          <FontAwesome name="search" size={20} color={Colors[colorScheme].icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            placeholder="Tìm kiếm sách..."
            placeholderTextColor={Colors[colorScheme].icon}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.filterChip, { backgroundColor: Colors[colorScheme].tint }]}>
            <Text style={styles.filterChipText}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
            <Text style={[styles.filterChipText, { color: Colors[colorScheme].text }]}>Tiểu thuyết</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
            <Text style={[styles.filterChipText, { color: Colors[colorScheme].text }]}>Kỹ năng sống</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
            <Text style={[styles.filterChipText, { color: Colors[colorScheme].text }]}>Khoa học</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {mockSearchResults.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={[styles.bookCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}
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
                  <FontAwesome name="bookmark" size={14} color={Colors[colorScheme].icon} />
                  <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                    {book.category}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome name="map-marker" size={14} color={Colors[colorScheme].icon} />
                  <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                    {book.location}
                  </Text>
                </View>
              </View>
              <View style={[styles.availabilityBadge, { backgroundColor: book.available ? '#4CAF50' : '#F44336' }]}>
                <Text style={styles.availabilityText}>
                  {book.available ? 'Có sẵn' : 'Đã mượn'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 60,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    color: 'white',
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
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
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  availabilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
}); 