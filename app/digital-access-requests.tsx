import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { documentService } from '@/services/book/document.service';
import { AccessRequest } from '../services/book/document.service';

interface AccessRequestResponse {
  success: boolean;
  data: {
    digitalId: number;
    totalBorrowers: number;
    borrowers: AccessRequest[];
  };
}

export default function DocumentAccessRequestsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const params = useLocalSearchParams();
  const digitalId = Number(params.digitalId);
  const documentName = params.documentName as string;
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [totalBorrowers, setTotalBorrowers] = useState(0);

  useEffect(() => {
    if (digitalId) {
      fetchAccessRequests();
    }
  }, [digitalId]);

  const fetchAccessRequests = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAccessRequests(digitalId);
      if (response.success && response.data) {
        setRequests(response.data.borrowers);
        setTotalBorrowers(response.data.totalBorrowers);
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      let response;
      if (status === 'APPROVED') {
        response = await documentService.approveDigitalDocument(requestId);
      } else {
        // Hiển thị dialog để nhập lý do từ chối
        Alert.prompt(
          'Lý do từ chối',
          'Vui lòng nhập lý do từ chối yêu cầu này',
          [
            {
              text: 'Hủy',
              style: 'cancel',
            },
            {
              text: 'Xác nhận',
              onPress: async (message) => {
                if (message) {
                  try {
                    response = await documentService.rejectDigitalDocument(requestId, message);
                    if (response.success) {
                      Alert.alert('Thành công', response.message);
                      fetchAccessRequests(); // Refresh danh sách
                    } else {
                      Alert.alert('Lỗi', response.message);
                    }
                  } catch (error) {
                    console.error('Error rejecting request:', error);
                    Alert.alert('Lỗi', 'Không thể từ chối yêu cầu. Vui lòng thử lại sau.');
                  }
                }
              },
            },
          ],
          'plain-text'
        );
        return;
      }

      if (response?.success) {
        Alert.alert('Thành công', response.message);
        fetchAccessRequests(); // Refresh danh sách
      } else {
        Alert.alert('Lỗi', response?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error handling request action:', error);
      Alert.alert('Lỗi', 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
    }
  };

  const getStatusColor = (status: AccessRequest['status']) => {
    switch (status) {
      case 'APPROVED':
        return {
          background: '#E8F5E9',
          text: '#2E7D32'
        };
      case 'PENDING':
        return {
          background: '#FFF3E0',
          text: '#E65100'
        };
      case 'REJECTED':
        return {
          background: '#FFEBEE',
          text: '#C62828'
        };
      default:
        return {
          background: '#F5F5F5',
          text: '#616161'
        };
    }
  };

  const getStatusText = (status: AccessRequest['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'Đã duyệt';
      case 'PENDING':
        return 'Đang chờ duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return 'Không xác định';
    }
  };

  const renderRequestItem = ({ item }: { item: AccessRequest }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <View style={[styles.requestItem, { backgroundColor: Colors[colorScheme].background }]}>
        <View style={styles.requestHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarContainer, { backgroundColor: Colors[colorScheme].tint + '20' }]}>
              <FontAwesome name="user-circle" size={32} color={Colors[colorScheme].tint} />
            </View>
            <View style={styles.userTextContainer}>
              <Text style={[styles.userName, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                {item.requesterName}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.background }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <View style={[styles.iconContainer, { backgroundColor: Colors[colorScheme].tint + '20' }]}>
              <FontAwesome name="clock-o" size={14} color={Colors[colorScheme].tint} />
            </View>
            <Text style={[styles.detailText, { color: Colors[colorScheme].text }]} numberOfLines={1}>
              {new Date(item.requestTime).toLocaleString('vi-VN')}
            </Text>
          </View>
          {item.decisionTime && (
            <View style={styles.detailRow}>
              <View style={[styles.iconContainer, { backgroundColor: Colors[colorScheme].tint + '20' }]}>
                <FontAwesome name="check-circle" size={14} color={Colors[colorScheme].tint} />
              </View>
              <Text style={[styles.detailText, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                {new Date(item.decisionTime).toLocaleString('vi-VN')}
              </Text>
            </View>
          )}
          {item.licenseExpiry && (
            <View style={styles.detailRow}>
              <View style={[styles.iconContainer, { backgroundColor: Colors[colorScheme].tint + '20' }]}>
                <FontAwesome name="calendar" size={14} color={Colors[colorScheme].tint} />
              </View>
              <Text style={[styles.detailText, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                {new Date(item.licenseExpiry).toLocaleString('vi-VN')}
              </Text>
            </View>
          )}
        </View>

        {item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleRequestAction(item.id, 'APPROVED')}
            >
              <FontAwesome name="check" size={16} color="white" />
              <Text style={styles.actionButtonText}>Duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRequestAction(item.id, 'REJECTED')}
            >
              <FontAwesome name="times" size={16} color="white" />
              <Text style={styles.actionButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
          title: `Yêu cầu mượn - ${documentName}`,
          headerShown: true,
        }} 
      />

      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryText, { color: Colors[colorScheme].text }]}>
          Tổng số người mượn: {totalBorrowers}
        </Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="users" size={64} color={Colors[colorScheme].text} />
          <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
            Chưa có yêu cầu mượn nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  summaryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#2E7D32',
  },
  rejectButton: {
    backgroundColor: '#C62828',
  },
  actionButtonText: {
    color: 'white',
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
}); 