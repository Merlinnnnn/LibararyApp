import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { loanService, LoanResponse, LoanStatus } from '@/services/loan/loan.service';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Giả sử LoanResponse có trường isEbook: boolean

const FILTERS = [
  { key: 'PHYSICAL', label: 'Sách vật lý', icon: 'library-outline' },
  { key: 'EBOOK', label: 'Sách điện tử', icon: 'tablet-portrait-outline' },
];

interface UserBorrowedBooksProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

const UserBorrowedBooks = ({ onLoadingChange }: UserBorrowedBooksProps) => {
  const [borrowedBooks, setBorrowedBooks] = useState<LoanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { userInfo } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const fetchBorrowedBooks = async (pageNum: number = 0) => {
    try {
      const response = await loanService.getUserBorrowedBooks('', pageNum);
      if (pageNum === 0) {
        setBorrowedBooks(response.content);
      } else {
        setBorrowedBooks(prev => [...prev, ...response.content]);
      }
      setHasMore(!response.last);
    } catch (error) {
      console.error('Error fetching borrowed books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBorrowedBooks();
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchBorrowedBooks(page + 1);
    }
  };

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.BORROWED:
        return (
          <View style={[styles.badge, { backgroundColor: '#FFA000' }]}> 
            <View>
              <Ionicons name="time-outline" size={14} color="#fff" />
            </View>
            <Text style={styles.badgeText}>Đang mượn</Text>
          </View>
        );
      case LoanStatus.RESERVED:
        return (
          <View style={[styles.badge, { backgroundColor: '#1976D2' }]}> 
            <View>
              <Ionicons name="bookmark-outline" size={14} color="#fff" />
            </View>
            <Text style={styles.badgeText}>Đã đặt trước</Text>
          </View>
        );
      case LoanStatus.RETURNED:
        return (
          <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}> 
            <View>
              <Ionicons name="checkmark-done" size={14} color="#fff" />
            </View>
            <Text style={styles.badgeText}>Đã trả</Text>
          </View>
        );
      case LoanStatus.CANCELLED_AUTO:
        return (
          <View style={[styles.badge, { backgroundColor: '#BDBDBD' }]}> 
            <View>
              <Ionicons name="close-circle-outline" size={14} color="#fff" />
            </View>
            <Text style={styles.badgeText}>Đã hủy</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const handleBookPress = (loanId: number) => {
    router.push({ pathname: '/loan/[id]', params: { id: loanId } });
  };

  const renderBookItem = ({ item }: { item: LoanResponse }) => {
    const dueDate = new Date(item.dueDate);
    const loanDate = new Date(item.loanDate);
    const isOverdue = item.status === LoanStatus.BORROWED && dueDate < new Date();
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => handleBookPress(item.transactionId)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.bookTitle}>{item.documentName}</Text>
          {getStatusBadge(item.status)}
        </View>
        <Text style={styles.bookId}>Mã sách: {item.documentId}</Text>
        <View style={styles.row}>
          <View>
            <Ionicons name="calendar-outline" size={16} color="#757575" />
          </View>
          <Text style={styles.dateText}>Ngày mượn: {formatDate(item.loanDate)}</Text>
        </View>
        <View style={styles.row}>
          <View>
            <MaterialIcons name="event-available" size={16} color="#757575" />
          </View>
          <Text style={styles.dateText}>Hạn trả: {formatDate(item.dueDate)}</Text>
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <View>
                <Ionicons name="alert-circle" size={14} color="#fff" />
              </View>
              <Text style={styles.overdueText}>Quá hạn {Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} ngày</Text>
            </View>
          )}
        </View>
        {item.paymentStatus !== 'NON_PAYMENT' && (
          <View style={styles.fineRow}>
            <View>
              <Ionicons name="cash-outline" size={16} color="#E65100" />
            </View>
            <Text style={styles.fineText}>
              <Text>Phí phạt: </Text>
              <Text>{item.fineAmount?.toLocaleString('vi-VN')}</Text>
              <Text> VNĐ</Text>
            </Text>
            <View style={[styles.fineBadge, item.paymentStatus === 'UNPAID' ? styles.unpaid : styles.paid]}>
              <Text style={styles.fineBadgeText}>{item.paymentStatus === 'UNPAID' ? 'Chưa thanh toán' : 'Đã thanh toán'}</Text>
            </View>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailText}>Xem chi tiết</Text>
          <View>
            <Ionicons name="chevron-forward" size={18} color="#2196F3" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBorrowedBooks(0);
    setRefreshing(false);
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingMoreText}>
          Đang tải thêm sách...
        </Text>
      </View>
    );
  };

  if (loading && page === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <FlatList
        data={borrowedBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.transactionId.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bạn chưa mượn sách nào</Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

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
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  bookId: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    gap: 4,
  },
  overdueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  fineText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  fineBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unpaid: {
    backgroundColor: '#F44336',
  },
  paid: {
    backgroundColor: '#4CAF50',
  },
  fineBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  detailText: {
    color: '#2196F3',
    fontSize: 13,
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
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
    opacity: 0.7,
  },
});

export default UserBorrowedBooks; 