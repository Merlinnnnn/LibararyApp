import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Alert 
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { useAuth } from '@/hooks/useAuth';

interface Book {
  transactionId: string;
  documentName: string;
  loanDate: string;
  returnDate?: string;
  status: string;
}

const BorrowedBooksScreen = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrCodeVisible, setQrCodeVisible] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const {logout} = useAuth();


  useEffect(() => {
    getToken();
  }, []);

  const getToken = async () => {
    const storedToken = await AsyncStorage.getItem('userToken');
    if (storedToken) {
      setToken(storedToken);
      fetchBorrowedBooks(storedToken);
    }
  };

  const fetchBorrowedBooks = async (authToken: string) => {
    if (!authToken) return;
    try {
      const response = await axios.get(
        'http://192.168.1.138:8009/api/v1/loan-transactions/user/borrowed-books',
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setBooks(response.data?.result?.content || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async (transactionId: string) => {
    try {
      const response = await axios.get(
        `http://192.168.1.138:8009/api/v1/loan-transactions/${transactionId}/qrcode-image`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer',
        }
      );
      const base64 = Buffer.from(response.data).toString('base64');
      setQrCodeImage(`data:image/png;base64,${base64}`);
      setQrCodeVisible(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải QR Code.');
    }
  };

  const closeQrCode = () => {
    setQrCodeImage(null);
    setQrCodeVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Nút Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Sách đang mượn</Text>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : books.length === 0 ? (
        <Text style={styles.noDataText}>Không có sách nào đang mượn.</Text>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.transactionId}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.bookTitle}>{item.documentName}</Text>
              <Text style={styles.bookInfo}>Mã giao dịch: {item.transactionId}</Text>
              <Text style={styles.bookInfo}>Ngày mượn: {item.loanDate}</Text>
              <Text style={styles.bookInfo}>Ngày trả: {item.returnDate || 'Chưa có'}</Text>
              <Text style={styles.bookStatus}>Trạng thái: {item.status}</Text>
              {(item.status === 'RECEIVED' || item.status === 'APPROVED') && (
                <TouchableOpacity 
                  style={styles.qrButton} 
                  onPress={() => fetchQrCode(item.transactionId)}
                >
                  <Text style={styles.qrButtonText}>Xem QR</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={qrCodeVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          {qrCodeImage && <Image source={{ uri: qrCodeImage }} style={styles.qrCodeImage} />}
          <TouchableOpacity onPress={closeQrCode} style={styles.closeButton}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookInfo: {
    fontSize: 14,
    color: '#555',
  },
  bookStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  qrButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  qrCodeImage: {
    width: 250,
    height: 250,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BorrowedBooksScreen;
