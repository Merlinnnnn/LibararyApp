import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { documentService } from '../services/book/document.service';
import { useAuth } from '../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UploadedFile {
  uploadId: number;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedAt: string;
}

interface DigitalDocument {
  digitalDocumentId: number;
  documentName: string;
  author: string;
  publisher: string;
  description: string;
  coverImage: string | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED_BY_AI' | 'APPROVED_BY_AI' | 'REJECTED';
  visibilityStatus: 'RESTRICTED_VIEW' | 'PUBLIC';
  uploads: UploadedFile[];
}

interface DocumentResponse {
  content: DigitalDocument[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  sortDetails: {
    property: string;
    direction: string;
  }[];
}

interface ApiResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

export default function UploadedDocumentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DigitalDocument[]>([]);
  const { userInfo } = useAuth();

  useEffect(() => {
    fetchUploadedDocuments();
  }, []);

  const fetchUploadedDocuments = async () => {
    try {
      setLoading(true);
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (!userInfoStr) {
        console.error('User info not found in storage');
        return;
      }
      const userInfoData = JSON.parse(userInfoStr);
      const userId = userInfoData.userId;
      
      if (!userId) {
        console.error('User ID not found in user info');
        return;
      }

      const response = await documentService.getUserUploadedDocuments(userId);
      if (response.success && response.data) {
        setDocuments(response.data.content);
      }
    } catch (error) {
      console.error('Error fetching uploaded documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DigitalDocument['approvalStatus']) => {
    switch (status) {
      case 'APPROVED':
        return {
          background: '#E8F5E9', // Light green background
          text: '#2E7D32' // Dark green text
        };
      case 'APPROVED_BY_AI':
        return {
          background: '#E3F2FD', // Light blue background
          text: '#1565C0' // Dark blue text
        };
      case 'PENDING':
        return {
          background: '#FFF3E0', // Light orange background
          text: '#E65100' // Dark orange text
        };
      case 'REJECTED':
        return {
          background: '#FFEBEE', // Light red background
          text: '#C62828' // Dark red text
        };
      case 'REJECTED_BY_AI':
        return {
          background: '#FCE4EC', // Light pink background
          text: '#C2185B' // Dark pink text
        };
      default:
        return {
          background: '#F5F5F5', // Light grey background
          text: '#616161' // Dark grey text
        };
    }
  };

  const getStatusText = (status: DigitalDocument['approvalStatus']) => {
    switch (status) {
      case 'APPROVED':
        return 'Đã duyệt';
      case 'APPROVED_BY_AI':
        return 'Đã duyệt bởi AI';
      case 'PENDING':
        return 'Đang chờ duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'REJECTED_BY_AI':
        return 'Bị từ chối bởi AI';
      default:
        return 'Không xác định';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return 'file-pdf-o';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'file-word-o';
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return 'file-excel-o';
    } else if (fileType.includes('image')) {
      return 'file-image-o';
    } else {
      return 'file-o';
    }
  };

  const getVisibilityColor = (status: string) => {
    switch (status) {
      case 'PUBLIC':
        return {
          text: '#2E7D32', // Dark green
          background: '#E8F5E9', // Light green
          icon: '#2E7D32'
        };
      case 'RESTRICTED_VIEW':
        return {
          text: '#D32F2F', // Dark red
          background: '#FFEBEE', // Light red
          icon: '#D32F2F'
        };
      default:
        return {
          text: Colors[colorScheme].text,
          background: Colors[colorScheme].background,
          icon: Colors[colorScheme].tint
        };
    }
  };

  const handleVisibilityToggle = async (documentId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'PUBLIC' ? 'RESTRICTED_VIEW' : 'PUBLIC';
      
      Alert.alert(
        'Thay đổi trạng thái',
        `Bạn có chắc muốn ${newStatus === 'PUBLIC' ? 'công khai' : 'hạn chế xem'} tài liệu này?`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Xác nhận',
            onPress: async () => {
              try {
                const response = await documentService.updateDocumentVisibility(documentId, newStatus);
                
                if (response.success) {
                  // Refresh the list on success
                  fetchUploadedDocuments();
                  Alert.alert('Thành công', response.message);
                } else {
                  // Show error message from API
                  Alert.alert('Không thể thay đổi trạng thái', response.message);
                }
              } catch (error) {
                console.error('Error updating visibility:', error);
                Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại sau.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error handling visibility toggle:', error);
    }
  };

  const renderDocumentItem = ({ item }: { item: DigitalDocument }) => {
    const visibilityColors = getVisibilityColor(item.visibilityStatus);
    const statusColors = getStatusColor(item.approvalStatus);
    
    return (
      <TouchableOpacity
        style={[styles.documentItem, { backgroundColor: Colors[colorScheme].background }]}
        onPress={() => {
          router.push({
            pathname: '/digital-access-requests',
            params: {
              digitalId: item.digitalDocumentId,
              documentName: item.documentName
            }
          });
        }}
      >
        <View style={styles.documentContent}>
          {item.coverImage ? (
            <Image
              source={{ uri: item.coverImage }}
              style={styles.coverImage}
            />
          ) : (
            <View style={[styles.coverImage, styles.coverIconContainer, { backgroundColor: Colors[colorScheme].tint + '10' }]}>
              <FontAwesome 
                name="file-text-o" 
                size={40} 
                color={Colors[colorScheme].tint} 
              />
            </View>
          )}
          <View style={styles.documentInfo}>
            <View style={styles.titleContainer}>
              <Text style={[styles.documentTitle, { color: Colors[colorScheme].text }]} numberOfLines={2}>
                {item.documentName}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.background }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {getStatusText(item.approvalStatus)}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <FontAwesome name="user" size={14} color={Colors[colorScheme].tint} style={styles.detailIcon} />
                <Text style={[styles.documentDetail, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                  {item.author}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome name="building" size={14} color={Colors[colorScheme].tint} style={styles.detailIcon} />
                <Text style={[styles.documentDetail, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                  {item.publisher}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.visibilityRow,
                  { backgroundColor: visibilityColors.background }
                ]}
                onPress={() => handleVisibilityToggle(item.digitalDocumentId, item.visibilityStatus)}
              >
                <FontAwesome 
                  name={item.visibilityStatus === 'PUBLIC' ? 'eye' : 'eye-slash'} 
                  size={14} 
                  color={visibilityColors.icon}
                  style={styles.detailIcon} 
                />
                <Text style={[styles.documentDetail, { color: visibilityColors.text }]}>
                  {item.visibilityStatus === 'PUBLIC' ? 'Công khai' : 'Hạn chế xem'}
                </Text>
                <FontAwesome 
                  name="chevron-right" 
                  size={12} 
                  color={visibilityColors.text}
                  style={styles.chevronIcon} 
                />
              </TouchableOpacity>
            </View>

            {item.uploads.map((upload, index) => (
              <View key={upload.uploadId} style={[styles.uploadInfo, { backgroundColor: Colors[colorScheme].tint + '08' }]}>
                <FontAwesome 
                  name={getFileIcon(upload.fileType)} 
                  size={16} 
                  color={Colors[colorScheme].tint} 
                  style={styles.fileIcon}
                />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                    {upload.fileName}
                  </Text>
                  <Text style={[styles.uploadDate, { color: Colors[colorScheme].text }]}>
                    {new Date(upload.uploadedAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
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
          title: 'Tài liệu đã tải lên',
          headerShown: true,
        }} 
      />

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="file-text-o" size={64} color={Colors[colorScheme].text} />
          <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
            Chưa có tài liệu nào được tải lên
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.digitalDocumentId.toString()}
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
  documentItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  documentContent: {
    flexDirection: 'row',
  },
  coverImage: {
    width: 110,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  coverIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  documentInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  detailsContainer: {
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
    opacity: 0.8,
    width: 16,
    textAlign: 'center',
  },
  documentDetail: {
    fontSize: 14,
    opacity: 0.8,
  },
  uploadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  fileIcon: {
    marginRight: 10,
    width: 16,
    textAlign: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  uploadDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  previewButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
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
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  chevronIcon: {
    marginLeft: 'auto',
    opacity: 0.5,
  },
}); 