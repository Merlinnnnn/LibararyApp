import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { documentService, AccessRequest, PhysicalBook } from '../services/book/document.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

type TabType = 'digital' | 'physical';

const getStatusBadge = (status: string, type: 'digital' | 'physical') => {
  if (type === 'digital') {
    switch (status) {
      case 'APPROVED':
        return {
          color: '#4CAF50',  // Màu xanh lá
          text: 'Đã duyệt',
          icon: 'check-circle'
        };
      case 'PENDING':
        return {
          color: '#FFA000',  // Màu cam
          text: 'Đang chờ duyệt',
          icon: 'access-time'
        };
      case 'REJECTED':
        return {
          color: '#F44336',  // Màu đỏ
          text: 'Đã từ chối',
          icon: 'cancel'
        };
      default:
        return {
          color: '#757575',  // Màu xám
          text: 'Không xác định',
          icon: 'help'
        };
    }
  } else {
    switch (status) {
      case 'BORROWED':
        return {
          color: '#FFA000',  // Màu cam
          text: 'Đang mượn',
          icon: 'access-time'
        };
      case 'RESERVED':
        return {
          color: '#1976D2',  // Màu xanh dương
          text: 'Đã đặt trước',
          icon: 'bookmark'
        };
      case 'RETURNED':
        return {
          color: '#4CAF50',  // Màu xanh lá
          text: 'Đã trả',
          icon: 'check-circle'
        };
      case 'CANCELLED_AUTO':
        return {
          color: '#BDBDBD',  // Màu xám
          text: 'Đã hủy',
          icon: 'cancel'
        };
      case 'UNDER_REVIEW':
        return {
          color: '#FFA000',  // Màu cam
          text: 'Đang xem xét',
          icon: 'access-time'
        };
      default:
        return {
          color: '#757575',  // Màu xám
          text: 'Không xác định',
          icon: 'help'
        };
    }
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'NON_PAYMENT':
      return {
        color: '#4CAF50',  // Màu xanh lá
        text: 'Không có phạt',
        icon: 'check-circle'
      };
    case 'UNPAID':
      return {
        color: '#F44336',  // Màu đỏ
        text: 'Chưa thanh toán',
        icon: 'cancel'
      };
    case 'CASH':
      return {
        color: '#4CAF50',  // Màu xanh lá
        text: 'Đã trả tiền mặt',
        icon: 'attach-money'
      };
    case 'VNPAY':
      return {
        color: '#4CAF50',  // Màu xanh lá
        text: 'Đã trả qua VNPAY',
        icon: 'credit-card'
      };
    default:
      return {
        color: '#757575',  // Màu xám
        text: 'Không xác định',
        icon: 'help'
      };
  }
};

const getReturnConditionBadge = (condition: string) => {
  switch (condition) {
    case 'NORMAL':
      return {
        color: '#4CAF50',  // Màu xanh lá
        text: 'Bình thường',
        icon: 'check-circle'
      };
    case 'DAMAGED':
      return {
        color: '#F44336',  // Màu đỏ
        text: 'Lý do: Hư sách',
        icon: 'warning'
      };
    case 'OVERDUE':
      return {
        color: '#F44336',  // Màu đỏ
        text: 'Lý do: Quá hạn',
        icon: 'warning'
      };
    default:
      return {
        color: '#757575',  // Màu xám
        text: 'Không xác định',
        icon: 'help'
      };
  }
};

export default function AccessHistoryScreen() {
  const colorScheme = useColorScheme() || 'light';
  const [activeTab, setActiveTab] = useState<TabType>('digital');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [digitalHistory, setDigitalHistory] = useState<AccessRequest[]>([]);
  const [physicalBooks, setPhysicalBooks] = useState<PhysicalBook[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setError(null);
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (!userInfoStr) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      const userInfo = JSON.parse(userInfoStr);

      if (activeTab === 'digital') {
        const response = await documentService.getUserAccessHistory(userInfo.userId);
        if (response.success) {
          setDigitalHistory(response.data.content);
        } else {
          setError(response.message || 'Không thể tải lịch sử truy cập');
        }
      } else {
        const response = await documentService.getUserPhysicalBooks(userInfo.userId);
        if (response.success) {
          setPhysicalBooks(response.data.content);
        } else {
          setError(response.message || 'Không thể tải danh sách sách vật lý');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderHistoryList = () => {
    if (activeTab === 'digital') {
      if (digitalHistory.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={80} color={Colors[colorScheme].icon} />
            <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
              Chưa có lịch sử mượn sách điện tử
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors[colorScheme].tint]}
              tintColor={Colors[colorScheme].tint}
            />
          }
        >
          {digitalHistory.map((request) => {
            const status = getStatusBadge(request.status, 'digital');
            return (
              <TouchableOpacity 
                key={request.id} 
                style={[
                  styles.requestCard, 
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
                    opacity: (request.status === 'APPROVED' && request.licenseExpiry && new Date(request.licenseExpiry) > new Date()) ? 1 : 0.7
                  }
                ]}
                onPress={() => {
                  if (request.status === 'APPROVED' && request.licenseExpiry && new Date(request.licenseExpiry) > new Date()) {
                    router.push({
                      pathname: '/reader',
                      params: {
                        id: request.digitalId,
                        requestId: request.id,
                        requestTime: request.requestTime,
                        decisionTime: request.decisionTime,
                        licenseExpiry: request.licenseExpiry
                      }
                    });
                  }
                }}
                disabled={request.status !== 'APPROVED' || !request.licenseExpiry || new Date(request.licenseExpiry) <= new Date()}
              >
                <Image 
                  source={{ uri: request.coverImage }} 
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <View style={styles.requestInfo}>
                  <View style={styles.requestHeader}>
                    <Text style={[styles.requestTitle, { color: Colors[colorScheme].text }]} numberOfLines={2}>
                      {request.documentName}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: status.color }]}>
                      <MaterialIcons name={status.icon as any} size={16} color="white" style={styles.badgeIcon} />
                      <Text style={styles.badgeText}>{status.text}</Text>
                    </View>
                  </View>

                  <View style={styles.bookMeta}>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="person" size={16} color={Colors[colorScheme].icon} />
                      <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                        {request.author || 'Chưa có thông tin'}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="business" size={16} color={Colors[colorScheme].icon} />
                      <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                        {request.publisher || 'Chưa có thông tin'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeInfo}>
                    <View style={styles.timeItem}>
                      <MaterialIcons name="access-time" size={16} color={Colors[colorScheme].icon} />
                      <Text style={[styles.timeText, { color: Colors[colorScheme].text }]}>
                        Yêu cầu: {format(new Date(request.requestTime), 'dd/MM/yyyy HH:mm')}
                      </Text>
                    </View>
                    {request.decisionTime && (
                      <View style={styles.timeItem}>
                        <MaterialIcons name="event" size={16} color={Colors[colorScheme].icon} />
                        <Text style={[styles.timeText, { color: Colors[colorScheme].text }]}>
                          Duyệt: {format(new Date(request.decisionTime), 'dd/MM/yyyy HH:mm')}
                        </Text>
                      </View>
                    )}
                    {request.licenseExpiry && (
                      <View style={styles.timeItem}>
                        <MaterialIcons name="timer" size={16} color={Colors[colorScheme].icon} />
                        <Text style={[styles.timeText, { color: Colors[colorScheme].text }]}>
                          Hết hạn: {format(new Date(request.licenseExpiry), 'dd/MM/yyyy HH:mm')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {request.description && (
                    <View style={styles.descriptionContainer}>
                      <MaterialIcons name="description" size={16} color={Colors[colorScheme].icon} />
                      <Text style={[styles.descriptionText, { color: Colors[colorScheme].text }]} numberOfLines={2}>
                        {request.description}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );
    }

    if (physicalBooks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={80} color={Colors[colorScheme].icon} />
          <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
            Chưa có sách vật lý
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors[colorScheme].tint]}
            tintColor={Colors[colorScheme].tint}
          />
        }
      >
        {physicalBooks.map((book) => {
          const status = getStatusBadge(book.status, 'physical');
          const paymentStatus = getPaymentStatusBadge(book.paymentStatus);
          const returnCondition = book.returnCondition ? getReturnConditionBadge(book.returnCondition) : null;
          const isOverdue = book.status === 'BORROWED' && book.dueDate && new Date(book.dueDate) < new Date();
          const daysOverdue = isOverdue ? Math.ceil((new Date().getTime() - new Date(book.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          
          return (
            <TouchableOpacity 
              key={book.transactionId} 
              style={[styles.requestCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }]}
              onPress={() => router.push({ 
                pathname: '/loan/[id]', 
                params: { id: book.transactionId } 
              })}
            >
              <View style={styles.requestInfo}>
                <View style={styles.requestHeader}>
                  <Text style={[styles.requestTitle, { color: Colors[colorScheme].text }]} numberOfLines={2}>
                    {book.documentName}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: status.color }]}>
                    <MaterialIcons name={status.icon as any} size={16} color="white" style={styles.badgeIcon} />
                    <Text style={styles.badgeText}>{status.text}</Text>
                  </View>
                </View>

                {isOverdue && (
                  <View style={[styles.overdueContainer, { backgroundColor: '#F44336' }]}>
                    <MaterialIcons name="warning" size={16} color="white" />
                    <Text style={styles.overdueText}>
                      Quá hạn {daysOverdue} ngày
                    </Text>
                  </View>
                )}

                <View style={styles.bookMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="person" size={16} color={Colors[colorScheme].icon} />
                    <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                      {book.author || 'Chưa có thông tin'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="business" size={16} color={Colors[colorScheme].icon} />
                    <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                      {book.publisher || 'Chưa có thông tin'}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeInfo}>
                  <View style={styles.timeItem}>
                    <MaterialIcons name="event" size={16} color={Colors[colorScheme].icon} />
                    <Text style={[styles.timeText, { color: Colors[colorScheme].text }]}>
                      Mượn: {format(new Date(book.loanDate), 'dd/MM/yyyy HH:mm')}
                    </Text>
                  </View>
                  {book.dueDate && (
                    <View style={styles.timeItem}>
                      <MaterialIcons name="timer" size={16} color={Colors[colorScheme].icon} />
                      <Text style={[styles.timeText, { color: Colors[colorScheme].text }]}>
                        Hạn trả: {format(new Date(book.dueDate), 'dd/MM/yyyy HH:mm')}
                      </Text>
                    </View>
                  )}
                  {book.returnDate && (
                    <View style={styles.timeItem}>
                      <MaterialIcons name="check-circle" size={16} color={Colors[colorScheme].icon} />
                      <Text style={[styles.timeText, { color: Colors[colorScheme].text }]}>
                        Trả: {format(new Date(book.returnDate), 'dd/MM/yyyy HH:mm')}
                      </Text>
                    </View>
                  )}
                </View>

                {book.fineAmount > 0 && (
                  <View style={styles.fineContainer}>
                    <MaterialIcons name="attach-money" size={16} color="#F44336" />
                    <Text style={styles.fineAmount}>
                      {book.fineAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                )}

                <View style={styles.paymentContainer}>
                  <MaterialIcons 
                    name={paymentStatus.icon as any} 
                    size={16} 
                    color={paymentStatus.color} 
                  />
                  <Text style={[
                    styles.paymentStatus,
                    { 
                      color: paymentStatus.color
                    }
                  ]}>
                    {paymentStatus.text}
                  </Text>
                </View>

                {returnCondition && (
                  <View style={[styles.returnConditionContainer, { backgroundColor: returnCondition.color + '20' }]}>
                    <MaterialIcons name={returnCondition.icon as any} size={16} color={returnCondition.color} />
                    <Text style={[styles.returnConditionText, { color: returnCondition.color }]}>
                      {returnCondition.text}
                    </Text>
                  </View>
                )}

                {book.description && (
                  <View style={styles.descriptionContainer}>
                    <MaterialIcons name="description" size={16} color={Colors[colorScheme].icon} />
                    <Text style={[styles.descriptionText, { color: Colors[colorScheme].text }]} numberOfLines={2}>
                      {book.description}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
          Lịch sử mượn sách
        </Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'digital' && styles.activeTab,
            { backgroundColor: Colors[colorScheme].background }
          ]}
          onPress={() => setActiveTab('digital')}
        >
          <MaterialIcons 
            name="menu-book" 
            size={24} 
            color={activeTab === 'digital' ? Colors[colorScheme].tint : Colors[colorScheme].text} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'digital' ? Colors[colorScheme].tint : Colors[colorScheme].text }
          ]}>
            Sách điện tử
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'physical' && styles.activeTab,
            { backgroundColor: Colors[colorScheme].background }
          ]}
          onPress={() => setActiveTab('physical')}
        >
          <MaterialIcons 
            name="book" 
            size={24} 
            color={activeTab === 'physical' ? Colors[colorScheme].tint : Colors[colorScheme].text} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'physical' ? Colors[colorScheme].tint : Colors[colorScheme].text }
          ]}>
            Sách vật lý
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color={Colors[colorScheme].icon} />
          <Text style={[styles.errorText, { color: Colors[colorScheme].text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: Colors[colorScheme].tint }]} 
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderHistoryList()
      )}
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  requestCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
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
  requestInfo: {
    flex: 1,
    gap: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  timeInfo: {
    gap: 4,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    opacity: 0.7,
  },
  fineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  fineAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  returnConditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  returnConditionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bookMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    opacity: 0.7,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  overdueText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});