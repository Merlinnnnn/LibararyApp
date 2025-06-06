import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { favoriteService, FavoriteDocumentResponse } from '../services/book/favoriteService';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme() || 'light';
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchFavorites = async (page: number = 0) => {
    try {
      const response = await favoriteService.getFavorites(page);
      if (response.success) {
        if (page === 0) {
          setFavorites(response.data.content);
        } else {
          setFavorites(prev => [...prev, ...response.data.content]);
        }
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.pageNumber);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites(0);
  };

  const handleLoadMore = () => {
    if (!loading && currentPage < totalPages - 1) {
      fetchFavorites(currentPage + 1);
    }
  };

  const handleBookPress = (book: FavoriteDocumentResponse) => {
    router.push({
      pathname: '/book/[id]',
      params: { id: book.documentId }
    });
  };

  const handleToggleFavorite = async (documentId: number) => {
    try {
      const response = await favoriteService.unfavorite(documentId);
      if (response.success) {
        setFavorites(prev => prev.filter(book => book.documentId !== documentId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderBookItem = ({ item }: { item: FavoriteDocumentResponse }) => (
    <TouchableOpacity
      style={[styles.bookCard, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#FFFFFF' }]}
      onPress={() => handleBookPress(item)}
    >
      <View style={styles.coverContainer}>
        <Image 
          source={{ uri: item.coverImage }} 
          style={styles.coverImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.bookInfo}>
        <View style={styles.bookHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Tên sách:</Text>
              <Text style={[styles.bookTitle, { color: Colors[colorScheme].text }]} numberOfLines={2}>
                {item.documentName}
              </Text>
            </View>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Tác giả:</Text>
              <Text style={[styles.bookAuthor, { color: Colors[colorScheme].text }]} numberOfLines={1}>
                {item.author}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(item.documentId);
            }}
          >
            <FontAwesome name="heart" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <View style={styles.bookMeta}>
          <View style={[styles.metaItem, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <FontAwesome name="book" size={14} color={Colors[colorScheme].icon} />
            <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
              {item.documentCategory}
            </Text>
          </View>
          <View style={[styles.metaItem, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <FontAwesome name="calendar" size={14} color={Colors[colorScheme].icon} />
            <Text style={[styles.metaText, { color: Colors[colorScheme].text }]}>
              {new Date(item.publishedDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
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
          title: 'Sách yêu thích',
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
          },
        }} 
      />

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="heart" size={50} color={Colors[colorScheme].icon} />
          <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
            Bạn chưa có sách yêu thích nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderBookItem}
          keyExtractor={item => item.documentId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors[colorScheme].tint]}
              tintColor={Colors[colorScheme].tint}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && !refreshing ? (
              <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
            ) : null
          }
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    gap: 16,
  },
  coverContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 12,
  },
  coverImage: {
    width: 120,
    height: 170,
    borderRadius: 12,
  },
  bookInfo: {
    flex: 1,
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    gap: 8,
  },
  labelContainer: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  bookAuthor: {
    fontSize: 15,
    opacity: 0.8,
    fontWeight: '500',
  },
  bookMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 13,
    opacity: 0.9,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 6,
    marginLeft: 4,
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