import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
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
  const [sections, setSections] = useState<BookSection[]>([
    {
      title: 'Sách gợi ý cho bạn',
      books: [],
      loading: true,
      emptyMessage: 'Không có sách gợi ý'
    },
    {
      title: 'Sách chương trình học kỳ này',
      books: [],
      loading: true,
      emptyMessage: 'Không có sách liên quan'
    }
  ]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchBooks = async () => {
    try {
      const [recommended, program] = await Promise.all([
        getRecommendedBooks(),
        getProgramRelatedBooks()
      ]);
      setSections(prev => [
        { ...prev[0], books: recommended, loading: false },
        { ...prev[1], books: program, loading: false }
      ]);
    } catch (error) {
      console.error('Error fetching books:', error);
      setSections(prev => prev.map(section => ({ ...section, loading: false })));
    }
  };

  useEffect(() => {
    fetchBooks();
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

    return books.map((book) => (
      <TouchableOpacity
        key={book.documentId}
        style={[styles.bookCard, { backgroundColor: Colors[colorScheme].background }]}
        onPress={() => router.push({
          pathname: '/book/[id]',
          params: { id: book.documentId }
        })}
      >
        <Image 
          source={{ uri: book.coverImage }} 
          style={styles.coverImage}
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
                name="heart-o" 
                size={20} 
                color={Colors[colorScheme].icon} 
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
              <FontAwesome name="bookmark" size={14} color={Colors[colorScheme].icon} />
              <Text style={[styles.metaText, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                {book.documentTypes.map(type => type.typeName).join(', ')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="book" size={14} color={Colors[colorScheme].icon} />
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
      </TouchableOpacity>
    ));
  };

  const handleToggleFavorite = async (documentId: number) => {
    try {
      await favoriteService.toggleFavorite(documentId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
                source={require('../../assets/images/react-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.appName, { color: Colors[colorScheme].text }]}>
                LibraSys
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
                onPress={() => router.push('/digital-viewer')}
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
  bookCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  coverImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 14,
    opacity: 0.7,
  },
  bookPublisher: {
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
