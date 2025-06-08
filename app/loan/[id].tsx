import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, Modal, Linking, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loanService, LoanResponse, LoanStatus, ReturnCondition } from '@/services/loan/loan.service';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDate } from '@/utils/format';

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

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loan, setLoan] = useState<LoanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoanDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await loanService.getLoanById(Number(id));
      setLoan(response);
    } catch (error: any) {
      console.error('Error fetching loan detail:', error);
      setError(error.message || 'Không thể tải thông tin mượn sách');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLoanDetail();
    setRefreshing(false);
  }, [fetchLoanDetail]);

  useEffect(() => {
    fetchLoanDetail();
  }, [fetchLoanDetail]);

  const handleGetQRCode = async () => {
    try {
      setLoadingQR(true);
      setShowQRModal(true);
      
      // Gọi API thông qua loanService để lấy QR code
      const qrCodeUrl = await loanService.getQRCodeImage(loan!.transactionId);
      setQrCodeUrl(qrCodeUrl);
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
      Alert.alert('Lỗi', 'Không thể tải mã QR. Vui lòng thử lại sau.');
      setShowQRModal(false);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleReturnDamaged = async () => {
    try {
      setLoading(true);
      await loanService.createFineForDamagedOrLostBook(loan!.transactionId);
      await fetchLoanDetail();
      Alert.alert('Thành công', 'Đã tạo phí phạt cho sách bị hư hỏng.');
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      console.log(loan?.transactionId);
      const response = await loanService.processVNPayPayment(loan!.transactionId);
      console.log(response);
      if (response && response.redirectUrl) {
        // Open the VNPay payment URL in browser
        Linking.openURL(response.redirectUrl);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo đơn thanh toán. Vui lòng thử lại sau.');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể xử lý thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error || !loan) {
    return (
      <View style={styles.errorContainer}>
        <View>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        </View>
        <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin mượn sách'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLoanDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOverdue = loan.status === LoanStatus.BORROWED && new Date(loan.dueDate) < new Date();
  const daysOverdue = isOverdue 
    ? Math.ceil((new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3"
        />
      }
    >
      <View style={styles.section}>
        <Text style={styles.title}>{loan.documentName}</Text>
        <Text style={styles.subTitle}>
          <Text>Mã sách: </Text>
          <Text>{loan.documentId}</Text>
        </Text>
        <View style={styles.statusContainer}>
          {getStatusBadge(loan.status)}
          {isOverdue && (
            <View style={[styles.badge, { backgroundColor: '#F44336' }]}>
              <View>
                <Ionicons name="alert-circle" size={14} color="#fff" />
              </View>
              <Text style={styles.badgeText}>
                <Text>Quá hạn </Text>
                <Text>{daysOverdue}</Text>
                <Text> ngày</Text>
              </Text>
            </View>
          )}
        </View>
        {(loan.status === LoanStatus.BORROWED || loan.status === LoanStatus.RESERVED) && (
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={handleGetQRCode}
            disabled={loadingQR}
          >
            {loadingQR ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <>
                <View>
                  <Ionicons name="qr-code-outline" size={20} color="#2196F3" />
                </View>
                <Text style={styles.qrButtonText}>
                  {loan.status === LoanStatus.BORROWED ? 'Xem mã QR trả sách' : 'Xem mã QR nhận sách'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin mượn</Text>
        <View style={styles.infoRow}>
          <View>
            <Ionicons name="calendar-outline" size={18} color="#757575" />
          </View>
          <Text style={styles.label}>Ngày mượn:</Text>
          <Text style={styles.value}>{formatDate(loan.loanDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <View>
            <MaterialIcons name="event-available" size={18} color="#757575" />
          </View>
          <Text style={styles.label}>Hạn trả:</Text>
          <Text style={[styles.value, isOverdue && styles.overdue]}>{formatDate(loan.dueDate)}</Text>
        </View>
        {loan.returnDate && (
          <View style={styles.infoRow}>
            <View>
              <Ionicons name="checkmark-done" size={18} color="#4CAF50" />
            </View>
            <Text style={styles.label}>Ngày trả:</Text>
            <Text style={styles.value}>{formatDate(loan.returnDate)}</Text>
          </View>
        )}
        {loan.returnCondition && (
          <View style={styles.infoRow}>
            <View>
              <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
            </View>
            <Text style={styles.label}>Tình trạng trả:</Text>
            <Text style={[styles.value, { color: '#F44336' }]}>
              {loan.returnCondition === ReturnCondition.DAMAGED ? 'Bị hư hỏng' :
               loan.returnCondition === ReturnCondition.OVERDUE ? 'Trả trễ' :
               'Bình thường'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin khác</Text>
        <View style={styles.infoRow}>
          <View>
            <Ionicons name="person-outline" size={18} color="#757575" />
          </View>
          <Text style={styles.label}>Người mượn:</Text>
          <Text style={styles.value}>{loan.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <View>
            <Ionicons name="person" size={18} color="#757575" />
          </View>
          <Text style={styles.label}>Thủ thư:</Text>
          <Text style={styles.value}>{loan.librarianName || '--'}</Text>
        </View>
        <View style={styles.infoRow}>
          <View>
            <Ionicons name="book-outline" size={18} color="#757575" />
          </View>
          <Text style={styles.label}>Mã sách:</Text>
          <Text style={styles.value}>{loan.documentId}</Text>
        </View>
        <View style={styles.infoRow}>
          <View>
            <Ionicons name="document-text-outline" size={18} color="#757575" />
          </View>
          <Text style={styles.label}>Tên sách:</Text>
          <Text style={styles.value}>{loan.documentName}</Text>
        </View>
      </View>

      {loan.paymentStatus !== 'NON_PAYMENT' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin phạt</Text>
          <View style={styles.infoRow}>
            <View>
              <Ionicons name="cash-outline" size={18} color="#E65100" />
            </View>
            <Text style={styles.label}>Phí phạt:</Text>
            <Text style={styles.fineText}>
              <Text>{loan.fineAmount?.toLocaleString('vi-VN')}</Text>
              <Text> VNĐ</Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View>
              <Ionicons name="card-outline" size={18} color="#757575" />
            </View>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={[styles.value, loan.paymentStatus === 'UNPAID' ? styles.unpaid : styles.paid]}>
              {loan.paymentStatus === 'UNPAID' ? 'Chưa thanh toán' : 'Đã thanh toán'}
            </Text>
          </View>
          {loan.paidAt && (
            <View style={styles.infoRow}>
              <View>
                <Ionicons name="time-outline" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.label}>Ngày thanh toán:</Text>
              <Text style={styles.value}>{formatDate(loan.paidAt)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {(loan.status === LoanStatus.BORROWED || loan.status === LoanStatus.RESERVED) && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F44336' }]} 
            onPress={handleReturnDamaged}
          >
            <View>
              <Ionicons name="warning-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionButtonText}>Báo hư hỏng</Text>
          </TouchableOpacity>
        )}
        {loan.paymentStatus !== 'NON_PAYMENT' && loan.paymentStatus === 'UNPAID' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} 
            onPress={handlePayment}
          >
            <View>
              <Ionicons name="cash-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowQRModal(false);
          setQrCodeUrl(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {loan.status === LoanStatus.BORROWED ? 'Mã QR trả sách' : 'Mã QR nhận sách'}
            </Text>
            {loadingQR ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : qrCodeUrl ? (
              <Image 
                source={{ uri: qrCodeUrl }} 
                style={styles.qrCode}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.errorText}>Không thể tải mã QR</Text>
            )}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowQRModal(false);
                setQrCodeUrl(null);
              }}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 18,
    borderRadius: 12,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 15,
    color: '#757575',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: '#666',
    minWidth: 90,
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  overdue: {
    color: '#F44336',
    fontWeight: '600',
  },
  fineText: {
    fontSize: 15,
    color: '#E65100',
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  unpaid: {
    color: '#F44336',
    fontWeight: '600',
  },
  paid: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  actionSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    opacity: 1,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  qrButtonText: {
    color: '#2196F3',
    fontSize: 15,
    fontWeight: '600',
  },
}); 