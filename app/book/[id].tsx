import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { documentService } from '../../services/book/document.service';
import { Document, DocumentCategory, VisibilityStatus } from '../../services/types/book.types';
import api from '../../services/config/axios';
import { getApiUrl } from '../../services/config/api.config';

const DEFAULT_COVER_IMAGE = 'https://res.cloudinary.com/dz9yzexh0/image/upload/v1746381613/document/default-cover.png';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const [book, setBook] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: 400,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    imageErrorContainer: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    imageErrorText: {
      fontSize: 16,
      opacity: 0.7,
    },
    content: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    authorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    author: {
      fontSize: 16,
      opacity: 0.8,
    },
    publisherContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    publisher: {
      fontSize: 16,
      opacity: 0.8,
    },
    metaContainer: {
      gap: 8,
      marginBottom: 24,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaText: {
      fontSize: 14,
      opacity: 0.7,
    },
    typesContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    typesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    typeChipText: {
      color: 'white',
      fontSize: 14,
    },
    coursesContainer: {
      marginBottom: 24,
    },
    coursesList: {
      gap: 12,
    },
    courseItem: {
      padding: 12,
      borderRadius: 8,
    },
    courseCode: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    courseName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    courseDescription: {
      fontSize: 14,
      opacity: 0.7,
    },
    descriptionContainer: {
      marginBottom: 24,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
    },
    summaryContainer: {
      marginBottom: 24,
    },
    summary: {
      fontSize: 16,
      lineHeight: 24,
    },
    digitalContainer: {
      marginBottom: 24,
    },
    digitalInfo: {
      padding: 16,
      borderRadius: 8,
    },
    digitalItem: {
      marginBottom: 12,
    },
    digitalLabel: {
      fontSize: 14,
      opacity: 0.7,
      marginBottom: 4,
    },
    digitalValue: {
      fontSize: 16,
      fontWeight: '500',
    },
    uploadItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    uploadText: {
      flex: 1,
      fontSize: 14,
    },
    uploadDate: {
      fontSize: 12,
      opacity: 0.7,
    },
    availabilityContainer: {
      marginBottom: 24,
    },
    availabilityInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: 8,
      padding: 16,
    },
    availabilityItem: {
      alignItems: 'center',
    },
    availabilityLabel: {
      fontSize: 14,
      opacity: 0.7,
      marginBottom: 4,
    },
    availabilityValue: {
      fontSize: 18,
      fontWeight: '600',
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors[colorScheme].background,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
    },
    borrowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    borrowButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 16,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await documentService.getBookById(Number(id));
      console.log('Book details:', response.data);
      console.log('Document category:', response.data.documentCategory);
      setBook(response.data);
    } catch (error) {
      console.error('Error fetching book details:', error);
      setError('Không thể tải thông tin sách. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleBorrowBook = () => {
    if (!book) return;
    
    Alert.alert(
      'Chọn loại tài liệu',
      'Vui lòng chọn loại tài liệu bạn muốn mượn',
      [
        {
          text: 'Hủy',
          style: 'cancel',
          textStyle: { color: Colors[colorScheme].text }
        },
        {
          text: 'Tài liệu vật lý',
          style: 'default',
          textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' },
          onPress: () => {
            Alert.alert(
              'Xác nhận mượn sách',
              'Bạn có chắc chắn muốn mượn sách vật lý này không?',
              [
                {
                  text: 'Hủy',
                  style: 'cancel',
                  textStyle: { color: Colors[colorScheme].text }
                },
                {
                  text: 'Đồng ý',
                  style: 'default',
                  textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' },
                  onPress: async () => {
                    try {
                      const response = await api.post(getApiUrl('/api/v1/loans'), {
                        physicalDocId: book.physicalDocument.physicalDocumentId
                      });
                      
                      if (response.data.success) {
                        Alert.alert(
                          'Thành công',
                          'Mượn sách thành công!',
                          [
                            {
                              text: 'OK',
                              style: 'default',
                              textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' },
                              onPress: () => {
                                fetchBookDetails();
                              }
                            }
                          ]
                        );
                      } else {
                        Alert.alert(
                          'Lỗi',
                          response.data.message || 'Không thể mượn sách. Vui lòng thử lại.',
                          [
                            {
                              text: 'OK',
                              style: 'default',
                              textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' }
                            }
                          ]
                        );
                      }
                    } catch (error) {
                      console.error('Error borrowing book:', error);
                      Alert.alert(
                        'Lỗi',
                        'Không thể mượn sách. Vui lòng thử lại.',
                        [
                          {
                            text: 'OK',
                            style: 'default',
                            textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' }
                          }
                        ]
                      );
                    }
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Tài liệu điện tử',
          style: 'default',
          textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' },
          onPress: () => {
            Alert.alert(
              'Xác nhận mượn sách điện tử',
              'Bạn có chắc chắn muốn mượn sách điện tử này không?',
              [
                {
                  text: 'Hủy',
                  style: 'cancel',
                  textStyle: { color: Colors[colorScheme].text }
                },
                {
                  text: 'Đồng ý',
                  style: 'default',
                  textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' },
                  onPress: async () => {
                    try {
                      const response = await api.post(getApiUrl('/api/v1/loans'), {
                        digitalDocId: book.digitalDocument.digitalDocumentId
                      });
                      
                      if (response.data.success) {
                        Alert.alert(
                          'Thành công',
                          'Mượn sách điện tử thành công!',
                          [
                            {
                              text: 'OK',
                              style: 'default',
                              textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' },
                              onPress: () => {
                                if (book.digitalDocument?.uploads?.[0]) {
                                  router.push({
                                    pathname: '/digital-viewer',
                                    params: { 
                                      id: book.documentId,
                                      fileName: book.digitalDocument.uploads[0].fileName,
                                      filePath: book.digitalDocument.uploads[0].filePath
                                    }
                                  });
                                }
                              }
                            }
                          ]
                        );
                      } else {
                        Alert.alert(
                          'Lỗi',
                          response.data.message || 'Không thể mượn sách điện tử. Vui lòng thử lại.',
                          [
                            {
                              text: 'OK',
                              style: 'default',
                              textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' }
                            }
                          ]
                        );
                      }
                    } catch (error) {
                      console.error('Error borrowing digital book:', error);
                      Alert.alert(
                        'Lỗi',
                        'Không thể mượn sách điện tử. Vui lòng thử lại.',
                        [
                          {
                            text: 'OK',
                            style: 'default',
                            textStyle: { color: Colors[colorScheme].tint, fontWeight: '600' }
                          }
                        ]
                      );
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: Colors[colorScheme].background }]}>
        <FontAwesome name="exclamation-circle" size={50} color={Colors[colorScheme].text} />
        <Text style={[styles.errorText, { color: Colors[colorScheme].text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: Colors[colorScheme].tint }]}
          onPress={fetchBookDetails}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.errorText, { color: Colors[colorScheme].text }]}>Không tìm thấy thông tin sách</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Stack.Screen 
        options={{
          title: book.documentName,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageError ? DEFAULT_COVER_IMAGE : book.coverImage }} 
            style={styles.coverImage}
            resizeMode="contain"
            onError={handleImageError}
          />
          {imageError && (
            <View style={styles.imageErrorContainer}>
              <FontAwesome name="image" size={24} color={Colors[colorScheme].icon} />
              <Text style={[styles.imageErrorText, { color: Colors[colorScheme].text }]}>
                Không thể tải hình ảnh
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
            {book.documentName}
          </Text>
          
          <View style={styles.authorContainer}>
            <FontAwesome name="user" size={16} color={Colors[colorScheme].icon} />
            <Text style={[styles.author, { color: Colors[colorScheme].text }]}>
              {book.author}
            </Text>
          </View>

          <View style={styles.publisherContainer}>
            <FontAwesome name="building" size={16} color={Colors[colorScheme].icon} />
            <Text style={[styles.publisher, { color: Colors[colorScheme].text }]}>
              {book.publisher}
            </Text>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <FontAwesome name="barcode" size={16} color={Colors[colorScheme].icon} />
              <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                ISBN: {book.isbn || 'Chưa có'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="language" size={16} color={Colors[colorScheme].icon} />
              <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                Ngôn ngữ: {book.language || 'Không xác định'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="calendar" size={16} color={Colors[colorScheme].icon} />
              <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                Ngày xuất bản: {book.publishedDate ? new Date(book.publishedDate).toLocaleDateString() : 'Chưa có'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="money" size={16} color={Colors[colorScheme].icon} />
              <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                Giá: {book.price ? book.price.toLocaleString('vi-VN') : 'Chưa có'} VNĐ
              </Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="book" size={16} color={Colors[colorScheme].icon} />
              <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                Loại tài liệu: {
                  book.documentCategory === DocumentCategory.PHYSICAL ? 'Tài liệu vật lý' :
                  book.documentCategory === DocumentCategory.DIGITAL ? 'Tài liệu điện tử' :
                  book.documentCategory === DocumentCategory.BOTH ? 'Tài liệu vật lý và điện tử' :
                  'Không xác định'
                }
              </Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="check-circle" size={16} color={Colors[colorScheme].icon} />
              <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                Trạng thái: {book.approvalStatus || 'Chưa duyệt'}
              </Text>
            </View>
          </View>

          <View style={styles.typesContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Loại tài liệu
            </Text>
            <View style={styles.typesList}>
              {book.documentTypes?.map((type) => (
                <View 
                  key={type.documentTypeId}
                  style={[styles.typeChip, { backgroundColor: Colors[colorScheme].tint }]}
                >
                  <Text style={styles.typeChipText}>{type.typeName}</Text>
                </View>
              )) || (
                <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
                  Chưa có loại tài liệu
                </Text>
              )}
            </View>
          </View>

          <View style={styles.coursesContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Môn học liên quan
            </Text>
            <View style={styles.coursesList}>
              {book.courses?.map((course) => (
                <View 
                  key={course.courseId}
                  style={[styles.courseItem, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}
                >
                  <Text style={[styles.courseCode, { color: Colors[colorScheme].text }]}>
                    {course.courseCode}
                  </Text>
                  <Text style={[styles.courseName, { color: Colors[colorScheme].text }]}>
                    {course.courseName}
                  </Text>
                  <Text style={[styles.courseDescription, { color: Colors[colorScheme].text }]}>
                    {course.description}
                  </Text>
                </View>
              )) || (
                <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
                  Chưa có môn học liên quan
                </Text>
              )}
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Mô tả
            </Text>
            <Text style={[styles.description, { color: Colors[colorScheme].text }]}>
              {book.description || 'Chưa có mô tả'}
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Tóm tắt
            </Text>
            <Text style={[styles.summary, { color: Colors[colorScheme].text }]}>
              {book.summary || 'Chưa có tóm tắt'}
            </Text>
          </View>

          <View style={styles.digitalContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Tài liệu số
            </Text>
            <View style={[styles.digitalInfo, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
              <View style={styles.digitalItem}>
                <Text style={[styles.digitalLabel, { color: Colors[colorScheme].text }]}>
                  Trạng thái:
                </Text>
                <Text style={[styles.digitalValue, { color: Colors[colorScheme].text }]}>
                  {book.digitalDocument?.visibilityStatus === VisibilityStatus.PUBLIC ? 'Công khai' :
                   book.digitalDocument?.visibilityStatus === VisibilityStatus.RESTRICTED_VIEW ? 'Xem có hạn chế' :
                   'Không có'}
                </Text>
              </View>
              {book.digitalDocument?.uploads?.map((upload) => (
                <View key={upload.uploadId} style={styles.uploadItem}>
                  <FontAwesome name="file-pdf-o" size={16} color={Colors[colorScheme].icon} />
                  <Text style={[styles.uploadText, { color: Colors[colorScheme].text }]}>
                    {upload.fileName}
                  </Text>
                  <Text style={[styles.uploadDate, { color: Colors[colorScheme].text }]}>
                    {new Date(upload.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.availabilityContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Tình trạng
            </Text>
            <View style={styles.availabilityInfo}>
              <View style={styles.availabilityItem}>
                <Text style={[styles.availabilityLabel, { color: Colors[colorScheme].text }]}>
                  Tổng số:
                </Text>
                <Text style={[styles.availabilityValue, { color: Colors[colorScheme].text }]}>
                  {book.quantity || 0}
                </Text>
              </View>
              <View style={styles.availabilityItem}>
                <Text style={[styles.availabilityLabel, { color: Colors[colorScheme].text }]}>
                  Đã mượn:
                </Text>
                <Text style={[styles.availabilityValue, { color: Colors[colorScheme].text }]}>
                  {book.physicalDocument?.borrowedCount || 0}
                </Text>
              </View>
              <View style={styles.availabilityItem}>
                <Text style={[styles.availabilityLabel, { color: Colors[colorScheme].text }]}>
                  Còn lại:
                </Text>
                <Text style={[styles.availabilityValue, { color: Colors[colorScheme].text }]}>
                  {book.physicalDocument?.availableCopies || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.borrowButton, 
            { 
              backgroundColor: Colors[colorScheme].tint
            }
          ]}
          onPress={handleBorrowBook}
        >
          <FontAwesome name="book" size={20} color="white" />
          <Text style={styles.borrowButtonText}>
            Mượn sách
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 