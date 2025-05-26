import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { digitalService, AccessRequest } from '@/services/loan/digital.service';

interface DigitalBooksProps {
  onReadBook?: (bookId: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function DigitalBooks({ onReadBook, onLoadingChange }: DigitalBooksProps) {
  const { colors } = useTheme();
  const { userInfo } = useAuth();
  const [digitalBooks, setDigitalBooks] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDigitalBooks = async (pageNum: number = 0) => {
    try {
      if (!userInfo.userId) return;
      const response = await digitalService.getUserDigitalBooks(userInfo.userId, pageNum);
      
      if (pageNum === 0) {
        setDigitalBooks(response.data.content);
      } else {
        setDigitalBooks(prev => [...prev, ...response.data.content]);
      }
      setHasMore(!response.data.last);
    } catch (error) {
      console.error('Error fetching digital books:', error);
    } finally {
      setLoading(false);
     
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDigitalBooks();
  }, [userInfo.userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDigitalBooks(0);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDigitalBooks(nextPage);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.badgeText}>Đã duyệt</Text>
          </View>
        );
      case 'PENDING':
        return (
          <View style={[styles.badge, { backgroundColor: '#FFA000' }]}>
            <Ionicons name="time" size={14} color="#fff" />
            <Text style={styles.badgeText}>Đang chờ</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={[styles.badge, { backgroundColor: '#F44336' }]}>
            <Ionicons name="close-circle" size={14} color="#fff" />
            <Text style={styles.badgeText}>Từ chối</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: AccessRequest }) => (
    <View style={[styles.bookCard, { backgroundColor: colors.card }]}>
      <View style={styles.bookInfo}>
        <View style={styles.titleRow}>
          <Text style={[styles.bookTitle, { color: colors.text }]}>
            {item.documentName || `Sách điện tử #${item.uploadId}`}
          </Text>
          {getStatusBadge(item.status)}
        </View>
        <View style={styles.metaContainer}>
          <View style={styles.bookMeta}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.bookMetaText, { color: colors.text }]}>
              Ngày yêu cầu: {formatDate(item.requestTime)}
            </Text>
          </View>
          {item.status === 'APPROVED' && item.licenseExpiry && (
            <View style={styles.bookMeta}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.bookMetaText, { color: colors.text }]}>
                Hết hạn: {formatDate(item.licenseExpiry)}
              </Text>
            </View>
          )}
        </View>
      </View>
      {item.status === 'APPROVED' && (
        <TouchableOpacity 
          style={[styles.readButton, { backgroundColor: colors.primary }]}
          onPress={() => onReadBook?.(item.uploadId.toString())}
        >
          <Text style={styles.readButtonText}>Đọc ngay</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && page === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sách điện tử đang mượn</Text>
      </View>

      <FlatList
        data={digitalBooks}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.contentContainer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bạn chưa mượn sách điện tử nào</Text>
          </View>
        }
        ListFooterComponent={
          loading && page > 0 ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
  },
  bookCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bookInfo: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  metaContainer: {
    gap: 4,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookMetaText: {
    fontSize: 14,
  },
  readButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  readButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
  },
}); 