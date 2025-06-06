import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { drmService } from '@/services/book/drm.service';
import * as FileSystem from 'expo-file-system';

const DecryptedReaderScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadDecryptedContent = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        setError(null);


        
        // Fetch decrypted content directly
        const contentResponse = await drmService.fetchDecryptedContent(params.id as string);
        console.log('Content Response Headers:', JSON.stringify(contentResponse.headers, null, 2));
        
        // Convert ArrayBuffer to Base64
        const bytes = new Uint8Array(contentResponse.data);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        // Create data URL for PDF
        const dataUrl = `data:application/pdf;base64,${base64}`;
        setPdfUri(dataUrl);
        console.log('PDF data URL created');
        
      } catch (error) {
        console.error('❌ Error in document processing:', error);
        setError('Không thể tải tài liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    loadDecryptedContent();
  }, [params.id]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Đang tải tài liệu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
            {params.documentName}
          </Text>
          <Text style={[styles.author, { color: colors.text }]} numberOfLines={1}>
            {params.author}
          </Text>
        </View>
        <View style={styles.pageInfo}>
          <Text style={[styles.pageText, { color: colors.text }]}>
            {currentPage} / {totalPages}
          </Text>
        </View>
      </View>

      {pdfUri ? (
        <Pdf
          source={{ uri: pdfUri }}
          style={styles.pdf}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
            setTotalPages(numberOfPages);
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Current page: ${page}`);
            setCurrentPage(page);
          }}
          onError={(error) => {
            console.log(error);
            setError('Không thể hiển thị tài liệu');
          }}
          enablePaging={true}
          horizontal={false}
          enableRTL={false}
          enableAnnotationRendering={true}
          fitPolicy={0}
          spacing={10}
          renderActivityIndicator={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Đang tải trang...
              </Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Không tìm thấy tài liệu
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    opacity: 0.7,
  },
  pageInfo: {
    marginLeft: 16,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
});

export default DecryptedReaderScreen; 