import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { digitalService, DigitalDocument } from '@/services/loan/digital.service';
import { useRouter } from 'expo-router';

interface DigitalBooksProps {
  onReadBook?: (uploadId: number) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function DigitalBooks({ onReadBook, onLoadingChange }: DigitalBooksProps) {
  const { colors } = useTheme();
  const { userInfo } = useAuth();
  const router = useRouter();
  const [digitalBooks, setDigitalBooks] = useState<DigitalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingReadId, setLoadingReadId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchDigitalBooks = async (pageNumber: number = 0, shouldRefresh: boolean = false) => {
    try {
      if (!userInfo.userId) return;
      setError(null);
      const response = await digitalService.getUserDigitalBooks();
      const newBooks = response.data.content;
      
      if (shouldRefresh) {
        setDigitalBooks(newBooks);
      } else {
        setDigitalBooks(prev => [...prev, ...newBooks]);
      }
      
      setHasMore(!response.data.last);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching digital books:', error);
      setError('Không thể tải danh sách sách điện tử. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    onLoadingChange?.(true);
    fetchDigitalBooks(0, true);
  }, [userInfo.userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDigitalBooks(0, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchDigitalBooks(page + 1);
    }
  };

  const handleReadBook = async (uploadId: number) => {
    try {
      setLoadingReadId(uploadId);
      const book = digitalBooks.find(book => 
        book.uploads.some(upload => upload.uploadId === uploadId)
      );
      
      if (book) {
        const upload = book.uploads.find(u => u.uploadId === uploadId);
        if (upload) {
          router.push({
            pathname: '/reader',
            params: { 
              id: upload.uploadId,
              fileName: upload.fileName,
              filePath: upload.filePath,
              documentName: book.documentName,
              author: book.author
            }
          });
        }
      }
    } catch (error) {
      console.error('Error reading book:', error);
    } finally {
      setLoadingReadId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderItem = ({ item }: { item: DigitalDocument }) => {
    const hasUploads = item.uploads && item.uploads.length > 0;

    return (
      <View style={[styles.bookCard, { backgroundColor: colors.card }]}>
        <View style={styles.bookInfo}>
          {item.coverImage ? (
            <Image 
              source={{ uri: item.coverImage }} 
              style={styles.coverImage}
              resizeMode="cover"
              onError={() => console.warn('Failed to load cover image')}
            />
          ) : (
            <View style={[styles.coverImage, styles.placeholderImage]}>
              <Ionicons name="book-outline" size={40} color={colors.primary} />
            </View>
          )}
          <View style={styles.detailsContainer}>
            <Text style={[styles.bookTitle, { color: colors.text }]}>
              {item.documentName}
            </Text>
            <View style={styles.metaContainer}>
              <View style={styles.bookMeta}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <Text style={[styles.bookMetaText, { color: colors.text }]}>
                  {item.author}
                </Text>
              </View>
              <View style={styles.bookMeta}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={[styles.bookMetaText, { color: colors.text }]}>
                  {item.publisher}
                </Text>
              </View>
            </View>
            <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>

        {hasUploads ? (
          <View style={styles.uploadsContainer}>
            <View style={styles.uploadsHeader}>
              <Ionicons name="documents-outline" size={20} color={colors.primary} />
              <Text style={[styles.uploadsTitle, { color: colors.text }]}>
                Tài liệu ({item.uploads.length})
              </Text>
            </View>
            <View style={styles.uploadsList}>
              {item.uploads.map((upload, index) => (
                <TouchableOpacity 
                  key={`${upload.uploadId}-${index}`}
                  style={[
                    styles.documentButton, 
                    { backgroundColor: colors.card, borderColor: colors.primary },
                    loadingReadId === upload.uploadId && styles.documentButtonDisabled
                  ]}
                  onPress={() => handleReadBook(upload.uploadId)}
                  disabled={loadingReadId === upload.uploadId}
                >
                  <View style={styles.documentButtonContent}>
                    <View style={styles.documentInfo}>
                      <Ionicons 
                        name={upload.fileType?.includes('pdf') ? 'document-text-outline' : 'document-outline'} 
                        size={24} 
                        color={colors.primary} 
                      />
                      <View style={styles.documentDetails}>
                        <Text style={[styles.documentName, { color: colors.text }]}>
                          {upload.fileName || `Tài liệu ${index + 1}`}
                        </Text>
                      </View>
                    </View>
                    {loadingReadId === upload.uploadId ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.noDocumentsContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.noDocumentsText, { color: colors.text }]}>
              Không có tài liệu
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingMoreText, { color: colors.text }]}>
          Đang tải thêm tài liệu...
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchDigitalBooks}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
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
        keyExtractor={(item, index) => `${item.digitalDocumentId}-${item.uploads[0]?.uploadId || 'no-upload'}-${index}`}
        contentContainerStyle={styles.contentContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bạn chưa mượn sách điện tử nào</Text>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
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
    flexDirection: 'row',
    marginBottom: 12,
  },
  coverImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaContainer: {
    gap: 4,
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookMetaText: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
  },
  uploadsContainer: {
    gap: 12,
  },
  uploadsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadsList: {
    gap: 8,
  },
  documentButton: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  documentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  documentButtonDisabled: {
    opacity: 0.7,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  noDocumentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    opacity: 0.7,
  },
  noDocumentsText: {
    fontSize: 14,
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
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 