import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Dimensions, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { getRecommendedBooks, getProgramRelatedBooks } from '../../services/book/recommendationService';
import { Document } from '../../services/types';
import { useRouter } from 'expo-router';
import { getUnreadNotificationsCount } from '../../services/notification/notificationService';
import ChatbotModal from '../components/ChatbotModal';
import { favoriteService } from '../../services/book/favoriteService';
import { documentService } from '../../services/book/document.service';

interface BookSection {
  title: string;
  books: Document[];
  loading: boolean;
  emptyMessage: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() || 'light';
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isWideScreen = screenWidth > 600; // Show 2 cards if screen width > 600px
  const [sections, setSections] = useState<BookSection[]>([
    {
      title: 'Sách chương trình học kỳ này',
      books: [],
      loading: true,
      emptyMessage: 'Không có sách liên quan'
    },
    {
      title: 'Sách gợi ý cho bạn',
      books: [],
      loading: true,
      emptyMessage: 'Không có sách gợi ý'
    }
  ]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({
    borrowedTotal: 0,
    borrowedCurr: 0,
    favorTotal: 0
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription.remove();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await documentService.getUserDocumentStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const [recommended, program] = await Promise.all([
        getRecommendedBooks(),
        getProgramRelatedBooks()
      ]);
      setSections(prev => [
        { ...prev[0], books: program, loading: false },
        { ...prev[1], books: recommended, loading: false }
      ]);
    } catch (error) {
      console.error('Error fetching books:', error);
      setSections(prev => prev.map(section => ({ ...section, loading: false })));
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadNotificationsCount();
        if (response.success) {
          setUnreadCount(response.data);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setSections(prev => prev.map(section => ({ ...section, loading: true })));
    await Promise.all([
      fetchBooks(),
      fetchStats(),
      getUnreadNotificationsCount().then(response => {
        if (response.success) {
          setUnreadCount(response.data);
        }
      }).catch(error => {
        console.error('Error fetching unread count:', error);
      })
    ]);
    setRefreshing(false);
  };

  const renderBookList = (books: Document[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return <Text style={[styles.loadingText, { color: Colors[colorScheme].text }]}>Đang tải...</Text>;
    }
    
    if (books.length === 0) {
      return <Text style={[styles.noBooksText, { color: Colors[colorScheme].text }]}>{emptyMessage}</Text>;
    }

    return (
      <View style={[styles.booksContainer, isWideScreen && styles.booksContainerWide]}>
        {books.map((book) => (
          <TouchableOpacity
            key={book.documentId}
            style={[
              styles.bookCard, 
              { backgroundColor: Colors[colorScheme].background },
              isWideScreen && styles.bookCardWide
            ]}
            onPress={() => router.push({
              pathname: '/book/[id]',
              params: { id: book.documentId }
            })}
          >
            <View style={[styles.bookContent, isWideScreen && styles.bookContentWide]}>
              <Image 
                source={{ uri: book.coverImage }} 
                style={[styles.coverImage, isWideScreen && styles.coverImageWide]}
                resizeMode="cover"
              />
              <View style={styles.bookInfo}>
                <View style={styles.bookHeader}>
                  <Text style={[styles.bookTitle, { color: Colors[colorScheme].text }]} numberOfLines={2}>
                    {book.documentName}
                  </Text>
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(book.documentId);
                    }}
                  >
                    <FontAwesome 
                      name={favorites.has(book.documentId) ? "heart" : "heart-o"} 
                      size={24} 
                      color={favorites.has(book.documentId) ? "#FF3B30" : Colors[colorScheme].icon} 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.bookAuthor, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                  {book.author}
                </Text>
                <Text style={[styles.bookPublisher, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                  {book.publisher}
                </Text>
                <View style={styles.bookMeta}>
                  <View style={styles.metaItem}>
                    <FontAwesome name="bookmark" size={16} color={Colors[colorScheme].icon} />
                    <Text style={[styles.metaText, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                      {book.documentTypes.map(type => type.typeName).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome name="book" size={16} color={Colors[colorScheme].icon} />
                    <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                      {book.documentCategory}
                    </Text>
                  </View>
                </View>
                <View style={[styles.availabilityBadge, { 
                  backgroundColor: (book.physicalDocument?.availableCopies ?? 0) > 0 ? '#4CAF50' : '#F44336' 
                }]}>
                  <Text style={styles.availabilityText}>
                    {(book.physicalDocument?.availableCopies ?? 0) > 0 ? 'Có sẵn' : 'Đã mượn'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleToggleFavorite = async (documentId: number) => {
    // Update UI immediately
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(documentId)) {
        newFavorites.delete(documentId);
      } else {
        newFavorites.add(documentId);
      }
      return newFavorites;
    });

    // Call API in background
    try {
      const response = favorites.has(documentId)
        ? await favoriteService.unfavorite(documentId)
        : await favoriteService.toggleFavorite(documentId);

      if (!response.success) {
        // Revert UI if API fails
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (newFavorites.has(documentId)) {
            newFavorites.delete(documentId);
          } else {
            newFavorites.add(documentId);
          }
          return newFavorites;
        });
        Alert.alert(
          'Thông báo',
          response.message || 'Không thể thực hiện thao tác này. Vui lòng thử lại.'
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert UI if API fails
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(documentId)) {
          newFavorites.delete(documentId);
        } else {
          newFavorites.add(documentId);
        }
        return newFavorites;
      });
      Alert.alert(
        'Thông báo',
        'Đã xảy ra lỗi. Vui lòng thử lại.'
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.appName, { color: Colors[colorScheme].text }]}>
                Modern Library
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
              >
                <FontAwesome name="bell" size={24} color={Colors[colorScheme].text} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => router.push('/profile')}
              >
                <View style={[styles.profileIcon, { backgroundColor: Colors[colorScheme].tint + '20' }]}>
                  <FontAwesome name="user-circle" size={24} color={Colors[colorScheme].tint} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
            <FontAwesome name="book" size={24} color={Colors[colorScheme].tint} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>
              {stats.borrowedCurr}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách đang mượn</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
            <FontAwesome name="history" size={24} color={Colors[colorScheme].tint} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>
              {stats.borrowedTotal}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách đã mượn</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme].background }]}>
            <FontAwesome name="heart" size={24} color={Colors[colorScheme].tint} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>
              {stats.favorTotal}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].text }]}>Sách yêu thích</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            Thư viện số
          </Text>
          <View style={[styles.libraryInfoCard, { backgroundColor: Colors[colorScheme].background }]}>
            <View style={styles.libraryInfoContent}>
              <View style={styles.libraryInfoHeader}>
                <FontAwesome name="book" size={20} color={Colors[colorScheme].tint} />
                <Text style={[styles.libraryInfoTitle, { color: Colors[colorScheme].text }]}>
                  Thư viện số mở cửa 24/7
                </Text>
              </View>
              <Text style={[styles.libraryInfoText, { color: Colors[colorScheme].text }]}>
                Truy cập kho tài liệu số mọi lúc, mọi nơi. Hỗ trợ đọc sách trực tuyến và tải tài liệu.
              </Text>
              <TouchableOpacity 
                style={[styles.libraryInfoButton, { backgroundColor: Colors[colorScheme].tint }]}
                onPress={() => router.push('/loan')}
              >
                <Text style={styles.libraryInfoButtonText}>Truy cập ngay</Text>
                <FontAwesome name="arrow-right" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              {section.title}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newBooksContainer}>
              {renderBookList(section.books, section.loading, section.emptyMessage)}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.chatbotButton, { backgroundColor: Colors[colorScheme].tint }]}
        onPress={() => setShowChatbot(true)}
      >
        <FontAwesome name="comments" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ChatbotModal 
        visible={showChatbot}
        onClose={() => setShowChatbot(false)}
      />
    </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileButton: {
    padding: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  libraryInfoCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  libraryInfoContent: {
    gap: 12,
  },
  libraryInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  libraryInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  libraryInfoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  libraryInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  libraryInfoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  newBooksContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  booksContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  booksContainerWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bookCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bookCardWide: {
    width: '48%',
  },
  bookContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  bookContentWide: {
    flexDirection: 'column',
    padding: 12,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 12,
  },
  coverImageWide: {
    width: '100%',
    height: 200,
    marginBottom: 12,
  },
  bookInfo: {
    flex: 1,
    gap: 8,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 24,
  },
  bookAuthor: {
    fontSize: 15,
    opacity: 0.8,
  },
  bookPublisher: {
    fontSize: 15,
    opacity: 0.8,
  },
  bookMeta: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 12,
  },
  availabilityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  noBooksText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  notificationButton: {
    padding: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatbotButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  favoriteButton: {
    padding: 4,
  },
});
