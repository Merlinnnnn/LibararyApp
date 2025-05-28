import React from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, FlatList, Alert, RefreshControl } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import { documentService } from '../../services/book/document.service';
import { Document, DocumentType, DocumentCategory, DocumentFilterParams } from '../../services/types/book.types';
import { useRouter } from 'expo-router';
import { favoriteService } from '../../services/book/favoriteService';

// Map document types to icons
const documentTypeIcons: Record<string, string> = {
  'Fiction': 'book-open-variant',
  'Science': 'flask',
  'History': 'clock-outline',
  'Technology': 'laptop',
  'default': 'book'
};

const INITIAL_TYPES_COUNT = 5;

export default function SearchScreen() {
  const colorScheme = useColorScheme() || 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [searchTypeQuery, setSearchTypeQuery] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<DocumentType[]>([]);
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<Document | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstFocus, setIsFirstFocus] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Fetch initial data and document types on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await Promise.all([
          fetchDocumentTypes(),
          debouncedSearch('', null, 0)
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      setIsLoadingTypes(true);
      const types = await documentService.getDocumentTypes();
      setDocumentTypes(types);
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching document types:', error);
      setError('Không thể tải danh sách loại tài liệu. Vui lòng thử lại.');
    } finally {
      setIsLoadingTypes(false);
    }
  };

  // Filter document types based on search query
  useEffect(() => {
    if (searchTypeQuery.trim() === '') {
      setFilteredTypes(documentTypes);
    } else {
      const filtered = documentTypes.filter(type => 
        type.typeName.toLowerCase().includes(searchTypeQuery.toLowerCase())
      );
      setFilteredTypes(filtered);
    }
  }, [searchTypeQuery, documentTypes]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, type: string | null, page: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const params: DocumentFilterParams = {
          documentName: query,
          page,
          size: 10,
          sortBy: 'documentId',
          sortDirection: 'desc',
          documentCategory: DocumentCategory.BOTH
        };

        if (type) {
          const typeId = documentTypes.find(t => t.typeName === type)?.documentTypeId;
          if (typeId) {
            params.documentTypeIds = [typeId];
          }
        }

        const response = await documentService.filterDocuments(params);
        if (page === 0) {
          setSearchResults(response.content);
        } else {
          setSearchResults(prev => [...prev, ...response.content]);
        }
        setTotalPages(response.totalPages);
        setCurrentPage(response.number);
      } catch (error) {
        console.error('Search error:', error);
        setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [documentTypes]
  );

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(0);
    debouncedSearch(text, selectedType, 0);
  };

  // Handle type filter change
  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type);
    setCurrentPage(0);
    debouncedSearch(searchQuery, type, 0);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoading && currentPage < totalPages - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      debouncedSearch(searchQuery, selectedType, nextPage);
    }
  };

  const handleTypeSelect = (typeName: string | null) => {
    handleTypeFilter(typeName);
    setShowTypesModal(false);
  };

  const renderTypeItem = ({ item }: { item: DocumentType }) => (
    <TouchableOpacity
      style={[
        styles.typeItem,
        selectedType === item.typeName && styles.typeItemSelected,
        { backgroundColor: selectedType === item.typeName ? Colors[colorScheme].tint : colorScheme === 'dark' ? '#333' : '#f5f5f5' }
      ]}
      onPress={() => handleTypeSelect(item.typeName)}
    >
      <Text style={[
        styles.typeItemText,
        { color: selectedType === item.typeName ? 'white' : Colors[colorScheme].text }
      ]}>
        {item.typeName}
      </Text>
    </TouchableOpacity>
  );

  const handleBookPress = (book: Document) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const handleBorrowBook = () => {
    if (!selectedBook) return;
    
    // Nếu chỉ là tài liệu vật lý
    if (selectedBook.documentCategory === DocumentCategory.PHYSICAL) {
      Alert.alert(
        'Xác nhận mượn sách',
        'Bạn có chắc chắn muốn mượn sách vật lý này không?',
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Đồng ý',
            style: 'default',
            onPress: async () => {
              try {
                const response = await documentService.borrowPhysicalDocument(selectedBook.physicalDocument.physicalDocumentId);
                
                if (response.success) {
                  Alert.alert(
                    'Thành công',
                    'Mượn sách thành công!',
                    [
                      {
                        text: 'OK',
                        style: 'default',
                        onPress: () => {
                          setShowBookModal(false);
                          // Refresh search results
                          handleSearchChange(searchQuery);
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert(
                    'Lỗi',
                    response.message || 'Không thể mượn sách. Vui lòng thử lại.'
                  );
                }
              } catch (error) {
                console.error('Error borrowing book:', error);
                Alert.alert(
                  'Lỗi',
                  'Không thể mượn sách. Vui lòng thử lại.'
                );
              }
            }
          }
        ]
      );
      return;
    }

    // Nếu chỉ là tài liệu điện tử
    if (selectedBook.documentCategory === DocumentCategory.DIGITAL) {
      Alert.alert(
        'Xác nhận mượn sách điện tử',
        'Bạn có chắc chắn muốn mượn sách điện tử này không?',
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Đồng ý',
            style: 'default',
            onPress: async () => {
              try {
                const response = await documentService.borrowDigitalDocument(selectedBook.digitalDocument.digitalDocumentId);
                
                if (response.success) {
                  Alert.alert(
                    'Thành công',
                    'Mượn sách điện tử thành công!',
                    [
                      {
                        text: 'OK',
                        style: 'default',
                        onPress: () => {
                          setShowBookModal(false);
                          if (selectedBook.digitalDocument?.uploads?.[0]) {
                            router.push({
                              pathname: '/digital-viewer',
                              params: { 
                                id: selectedBook.documentId,
                                fileName: selectedBook.digitalDocument.uploads[0].fileName,
                                filePath: selectedBook.digitalDocument.uploads[0].filePath
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
                    response.message || 'Không thể mượn sách điện tử. Vui lòng thử lại.'
                  );
                }
              } catch (error) {
                console.error('Error borrowing digital book:', error);
                Alert.alert(
                  'Lỗi',
                  'Không thể mượn sách điện tử. Vui lòng thử lại.'
                );
              }
            }
          }
        ]
      );
      return;
    }

    // Nếu là cả hai loại
    Alert.alert(
      'Chọn loại tài liệu',
      'Vui lòng chọn loại tài liệu bạn muốn mượn',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Tài liệu vật lý',
          style: 'default',
          onPress: () => {
            Alert.alert(
              'Xác nhận mượn sách',
              'Bạn có chắc chắn muốn mượn sách vật lý này không?',
              [
                {
                  text: 'Hủy',
                  style: 'cancel'
                },
                {
                  text: 'Đồng ý',
                  style: 'default',
                  onPress: async () => {
                    try {
                      const response = await documentService.borrowPhysicalDocument(selectedBook.physicalDocument.physicalDocumentId);
                      
                      if (response.success) {
                        Alert.alert(
                          'Thành công',
                          'Mượn sách thành công!',
                          [
                            {
                              text: 'OK',
                              style: 'default',
                              onPress: () => {
                                setShowBookModal(false);
                                // Refresh search results
                                handleSearchChange(searchQuery);
                              }
                            }
                          ]
                        );
                      } else {
                        Alert.alert(
                          'Lỗi',
                          response.message || 'Không thể mượn sách. Vui lòng thử lại.'
                        );
                      }
                    } catch (error) {
                      console.error('Error borrowing book:', error);
                      Alert.alert(
                        'Lỗi',
                        'Không thể mượn sách. Vui lòng thử lại.'
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
          onPress: () => {
            Alert.alert(
              'Xác nhận mượn sách điện tử',
              'Bạn có chắc chắn muốn mượn sách điện tử này không?',
              [
                {
                  text: 'Hủy',
                  style: 'cancel'
                },
                {
                  text: 'Đồng ý',
                  style: 'default',
                  onPress: async () => {
                    try {
                      const response = await documentService.borrowDigitalDocument(selectedBook.digitalDocument.digitalDocumentId);
                      
                      if (response.success) {
                        Alert.alert(
                          'Thành công',
                          'Mượn sách điện tử thành công!',
                          [
                            {
                              text: 'OK',
                              style: 'default',
                              onPress: () => {
                                setShowBookModal(false);
                                if (selectedBook.digitalDocument?.uploads?.[0]) {
                                  router.push({
                                    pathname: '/digital-viewer',
                                    params: { 
                                      id: selectedBook.documentId,
                                      fileName: selectedBook.digitalDocument.uploads[0].fileName,
                                      filePath: selectedBook.digitalDocument.uploads[0].filePath
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
                          response.message || 'Không thể mượn sách điện tử. Vui lòng thử lại.'
                        );
                      }
                    } catch (error) {
                      console.error('Error borrowing digital book:', error);
                      Alert.alert(
                        'Lỗi',
                        'Không thể mượn sách điện tử. Vui lòng thử lại.'
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

  const handleViewDetails = () => {
    if (selectedBook) {
      setShowBookModal(false);
      router.push({
        pathname: '/book/[id]',
        params: { id: selectedBook.documentId }
      });
    }
  };

  const handleSearchFocus = () => {
    if (isFirstFocus) {
      setIsFirstFocus(false);
      setIsInitialLoading(true);
      debouncedSearch('', selectedType, 0).finally(() => {
        setIsInitialLoading(false);
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [typesResponse, searchResponse] = await Promise.all([
        documentService.getDocumentTypes(),
        documentService.filterDocuments({
          documentName: searchQuery,
          page: 0,
          size: 10,
          sortBy: 'documentId',
          sortDirection: 'desc',
          documentCategory: DocumentCategory.BOTH,
          documentTypeIds: selectedType ? [documentTypes.find(t => t.typeName === selectedType)?.documentTypeId].filter(Boolean) : undefined
        })
      ]);
      
      setDocumentTypes(typesResponse);
      setSearchResults(searchResponse.content);
      setTotalPages(searchResponse.totalPages);
      setCurrentPage(searchResponse.number);
    } catch (error) {
      console.error('Error refreshing:', error);
      setError('Có lỗi xảy ra khi làm mới. Vui lòng thử lại.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleFavorite = async (documentId: number) => {
    // Update UI immediately
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(documentId)) {
        newFavorites.delete(documentId);
      } else {
        newFavorites.add(documentId);
      }
      return newFavorites;
    });

    // Call API in background
    try {
      await favoriteService.toggleFavorite(documentId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert UI if API fails
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(documentId)) {
          newFavorites.delete(documentId);
        } else {
          newFavorites.add(documentId);
        }
        return newFavorites;
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
          <FontAwesome name="search" size={20} color={Colors[colorScheme].icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            placeholder="Tìm kiếm theo tên sách, tác giả, nhà xuất bản..."
            placeholderTextColor={Colors[colorScheme].icon}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <FontAwesome name="times-circle" size={20} color={Colors[colorScheme].icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Loại tài liệu
        </Text>
        {isLoadingTypes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
          </View>
        ) : (
          <>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  selectedType === null && styles.filterChipSelected,
                  { backgroundColor: selectedType === null ? Colors[colorScheme].tint : colorScheme === 'dark' ? '#333' : '#f5f5f5' }
                ]}
                onPress={() => handleTypeFilter(null)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: selectedType === null ? 'white' : Colors[colorScheme].text }
                ]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              {documentTypes.slice(0, INITIAL_TYPES_COUNT).map((type) => (
                <TouchableOpacity
                  key={type.documentTypeId}
                  style={[
                    styles.filterChip,
                    selectedType === type.typeName && styles.filterChipSelected,
                    { backgroundColor: selectedType === type.typeName ? Colors[colorScheme].tint : colorScheme === 'dark' ? '#333' : '#f5f5f5' }
                  ]}
                  onPress={() => handleTypeFilter(type.typeName)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedType === type.typeName ? 'white' : Colors[colorScheme].text }
                  ]}>
                    {type.typeName}
                  </Text>
                </TouchableOpacity>
              ))}
              {documentTypes.length > INITIAL_TYPES_COUNT && (
                <TouchableOpacity 
                  style={[styles.filterChip, styles.moreChip]}
                  onPress={() => setShowTypesModal(true)}
                >
                  <Text style={[styles.filterChipText, { color: Colors[colorScheme].tint }]}>
                    +{documentTypes.length - INITIAL_TYPES_COUNT} loại khác
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <Modal
              visible={showTypesModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowTypesModal(false)}
            >
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
                      Chọn loại tài liệu
                    </Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setShowTypesModal(false)}
                    >
                      <FontAwesome name="times" size={24} color={Colors[colorScheme].text} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
                    <FontAwesome name="search" size={20} color={Colors[colorScheme].icon} style={styles.searchIcon} />
                    <TextInput
                      style={[styles.searchInput, { color: Colors[colorScheme].text }]}
                      placeholder="Tìm kiếm loại tài liệu..."
                      placeholderTextColor={Colors[colorScheme].icon}
                      value={searchTypeQuery}
                      onChangeText={setSearchTypeQuery}
                    />
                  </View>

                  <FlatList
                    data={filteredTypes}
                    renderItem={renderTypeItem}
                    keyExtractor={item => item.documentTypeId.toString()}
                    contentContainerStyle={styles.typeList}
                    ListEmptyComponent={
                      <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
                        Không tìm thấy loại tài liệu phù hợp
                      </Text>
                    }
                  />
                </View>
              </View>
            </Modal>
          </>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: Colors[colorScheme].text }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme].text }]}>
            Đang tải danh sách sách...
          </Text>
        </View>
      ) : isLoading && searchResults.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="search" size={50} color={Colors[colorScheme].icon} />
          <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
            Không tìm thấy kết quả phù hợp
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.resultsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors[colorScheme].tint]}
              tintColor={Colors[colorScheme].tint}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {searchResults.map((doc) => (
            <TouchableOpacity
              key={doc.documentId}
              style={[styles.bookCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}
              onPress={() => handleBookPress(doc)}
            >
              <Image 
                source={{ uri: doc.coverImage }} 
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={styles.bookInfo}>
                <View style={styles.bookHeader}>
                  <Text style={[styles.bookTitle, { color: Colors[colorScheme].text }]}>
                    {doc.documentName}
                  </Text>
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(doc.documentId);
                    }}
                  >
                    <FontAwesome 
                      name={favorites.has(doc.documentId) ? "heart" : "heart-o"} 
                      size={20} 
                      color={favorites.has(doc.documentId) ? "#FF3B30" : Colors[colorScheme].icon} 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.bookAuthor, { color: Colors[colorScheme].text }]}>
                  {doc.author}
                </Text>
                <Text style={[styles.bookPublisher, { color: Colors[colorScheme].text }]}>
                  {doc.publisher}
                </Text>
                <View style={styles.bookMeta}>
                  <View style={styles.metaItem}>
                    <FontAwesome name="bookmark" size={14} color={Colors[colorScheme].icon} />
                    <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                      {doc.documentTypes.map(type => type.typeName).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome name="book" size={14} color={Colors[colorScheme].icon} />
                    <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
                      {doc.documentCategory}
                    </Text>
                  </View>
                </View>
                <View style={[styles.availabilityBadge, { backgroundColor: doc.physicalDocument.availableCopies > 0 ? '#4CAF50' : '#F44336' }]}>
                  <Text style={styles.availabilityText}>
                    {doc.physicalDocument.availableCopies > 0 ? 'Có sẵn' : 'Đã mượn'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {isLoading && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showBookModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookModal(false)}
      >
        {selectedBook && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
                  Chi tiết sách
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowBookModal(false)}
                >
                  <FontAwesome name="times" size={24} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.bookDetailContent}>
                <Image 
                  source={{ uri: selectedBook.coverImage }} 
                  style={styles.detailCoverImage}
                  resizeMode="cover"
                />
                <View style={styles.bookDetailInfo}>
                  <Text style={[styles.detailTitle, { color: Colors[colorScheme].text }]}>
                    {selectedBook.documentName}
                  </Text>
                  <Text style={[styles.detailAuthor, { color: Colors[colorScheme].text }]}>
                    Tác giả: {selectedBook.author}
                  </Text>
                  <Text style={[styles.detailPublisher, { color: Colors[colorScheme].text }]}>
                    Nhà xuất bản: {selectedBook.publisher}
                  </Text>
                  <Text style={[styles.detailDescription, { color: Colors[colorScheme].text }]}>
                    {selectedBook.description}
                  </Text>
                  <View style={styles.detailMeta}>
                    <Text style={[styles.detailMetaText, { color: Colors[colorScheme].text }]}>
                      ISBN: {selectedBook.isbn}
                    </Text>
                    <Text style={[styles.detailMetaText, { color: Colors[colorScheme].text }]}>
                      Ngôn ngữ: {selectedBook.language || 'Không xác định'}
                    </Text>
                    <Text style={[styles.detailMetaText, { color: Colors[colorScheme].text }]}>
                      Số lượng: {selectedBook.physicalDocument.availableCopies}/{selectedBook.quantity}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={handleViewDetails}
                >
                  <FontAwesome name="info-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Xem chi tiết</Text>
                </TouchableOpacity>
                {((selectedBook.documentCategory === DocumentCategory.PHYSICAL && selectedBook.physicalDocument.availableCopies > 0) ||
                  (selectedBook.documentCategory === DocumentCategory.DIGITAL && selectedBook.digitalDocument) ||
                  (selectedBook.documentCategory === DocumentCategory.BOTH && (selectedBook.physicalDocument.availableCopies > 0 || selectedBook.digitalDocument))) && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.borrowButton]}
                    onPress={handleBorrowBook}
                  >
                    <FontAwesome name="book" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Mượn sách</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 60,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
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
    fontSize: 16,
    textAlign: 'center',
    color: '#F44336',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
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
  moreChip: {
    borderColor: Colors.light.tint,
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  typeList: {
    padding: 16,
  },
  typeItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  typeItemSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  typeItemText: {
    fontSize: 16,
  },
  bookDetailContent: {
    padding: 16,
  },
  detailCoverImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  bookDetailInfo: {
    gap: 8,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailAuthor: {
    fontSize: 16,
    opacity: 0.8,
  },
  detailPublisher: {
    fontSize: 16,
    opacity: 0.8,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  detailMeta: {
    marginTop: 16,
    gap: 4,
  },
  detailMetaText: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  viewButton: {
    backgroundColor: '#2196F3',
  },
  borrowButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
}); 