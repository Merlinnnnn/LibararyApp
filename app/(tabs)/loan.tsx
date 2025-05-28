import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UserBorrowedBooks from '@/components/loan/UserBorrowedBooks';
import DigitalBooks from '@/components/loan/DigitalBooks';

const FILTERS = [
  { key: 'PHYSICAL', label: 'Sách vật lý', icon: 'library-outline' },
  { key: 'EBOOK', label: 'Sách điện tử', icon: 'tablet-portrait-outline' },
];

export default function BorrowedScreen() {
  const [activeFilter, setActiveFilter] = useState('PHYSICAL');
  const router = useRouter();

  const handleReadBook = (bookId: string) => {
    // Navigate to digital viewer screen
    router.push({
      pathname: '/digital-viewer',
      params: { id: bookId }
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Sách đang mượn',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <View style={styles.filterHeaderWrap}>
        <View style={styles.filterHeader}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                activeOpacity={0.85}
                onPress={() => setActiveFilter(f.key)}
              >
                <View>
                  <Ionicons
                    name={f.icon as any}
                    size={20}
                    color={isActive ? '#fff' : '#2196F3'}
                    style={isActive ? { transform: [{ scale: 1.15 }] } : {}}
                  />
                </View>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeFilter === 'PHYSICAL' ? (
        <UserBorrowedBooks />
      ) : (
        <DigitalBooks onReadBook={handleReadBook} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterHeaderWrap: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    marginTop: 12,
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#e3eaf3',
    marginHorizontal: 4,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    transform: [{ scale: 1 }],
  },
  filterBtnActive: {
    backgroundColor: '#2196F3',
    shadowOpacity: 0.15,
    transform: [{ scale: 1.07 }],
  },
  filterText: {
    color: '#2196F3',
    fontWeight: '700',
    fontSize: 15,
  },
  filterTextActive: {
    color: '#fff',
  },
}); 