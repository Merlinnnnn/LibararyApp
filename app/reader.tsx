import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Platform, Dimensions, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { drmService } from '@/services/book/drm.service';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { convertDocxToHtml } from '../services/document/converterService';
import { useAuth } from '@/hooks/useAuth';

const DocumentViewer = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localFilePath, setLocalFilePath] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'html' | null>(null);
  const [keys, setKeys] = useState<{
    publicKey: string;
    privateKey: string;
    privateKeyRaw: string;
  } | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const { getCachedLicense, setCachedLicense, getValidLicense } = useAuth();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [isLicenseValid, setIsLicenseValid] = useState(true);

  // Initialize secure environment and generate RSA keys
  useEffect(() => {
    let isMounted = true;
    const initKeys = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        const generatedKeys = await drmService.initializeSecureEnvironment();
        if (isMounted) {
          setKeys(generatedKeys);
          console.log('✅ RSA keys initialized successfully');
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Error initializing RSA keys:', error);
          setError('Không thể khởi tạo môi trường đọc an toàn');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (params.id) {
      initKeys();
    }

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  // Hàm kiểm tra và xử lý license
  const checkAndHandleLicense = async () => {
    try {
      if (!params.id) return;

      const license = await getValidLicense(params.id as string);
      if (!license) {
        // Nếu không có license hợp lệ, thử xin license mới
        const newLicenseResponse = await drmService.requestLicense(params.id as string);
        if (newLicenseResponse.success) {
          // Cache license mới
          await setCachedLicense(params.id as string, {
            uploadId: params.id as string,
            license: {
              token: newLicenseResponse.data.encryptedContentKey,
              sessionToken: newLicenseResponse.data.sessionToken,
              expiresAt: Date.now() + (60 * 60 * 1000) // 1 giờ
            }
          });
          setIsLicenseValid(true);
        } else {
          // Không xin được license mới
          setIsLicenseValid(false);
          Alert.alert(
            'Thông báo',
            'Giấy phép đã hết hạn và không thể gia hạn. Vui lòng liên hệ quản trị viên.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        setIsLicenseValid(true);
      }
    } catch (error: any) {
      if (error?.message?.includes('License has been revoked')) {
        setIsLicenseValid(false);
        Alert.alert(
          'Thông báo',
          'Giấy phép đã bị thu hồi. Vui lòng liên hệ quản trị viên.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    }
  };

  // Khởi tạo kiểm tra license định kỳ
  useEffect(() => {
    // Kiểm tra ngay khi component mount
    checkAndHandleLicense();

    // Thiết lập interval kiểm tra mỗi phút
    heartbeatInterval.current = setInterval(checkAndHandleLicense, 60 * 1000);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [params.id]);

  // Nếu license không hợp lệ, hiển thị thông báo và chuyển về màn hình trước
  useEffect(() => {
    if (!isLicenseValid) {
      router.back();
    }
  }, [isLicenseValid]);

  // Add heartbeat function
  const startHeartbeat = (sessionToken: string) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = setInterval(async () => {
      try {
        console.log('heartbeat sessionToken:', sessionToken);
        await drmService.updateHeartbeat(sessionToken);
      } catch (error: any) {
        // Handle revoked or expired license
        if (error?.response?.status === 403 || error?.message?.includes('License has been revoked')) {
          if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
          }
          setIsLicenseValid(false);
          Alert.alert(
            'Phiên đọc đã bị chấm dứt',
            'Phiên đọc của bạn đã bị thu hồi hoặc hết hạn. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
            [{ 
              text: 'Quay lại',
              onPress: () => router.back()
            }]
          );
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  };

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAndDecryptDocument = async () => {
      if (!keys || !params.id || !isMounted) return;
      
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        // Check for cached license and content
        const cachedLicense = await getCachedLicense(params.id as string);
        let licenseResponse;

        if (cachedLicense) {
          try {
            // Validate cached license with heartbeat
            await drmService.updateHeartbeat(cachedLicense.license.sessionToken);
            // If heartbeat succeeds, use cached license
            licenseResponse = {
              data: {
                sessionToken: cachedLicense.license.sessionToken,
                encryptedContentKey: cachedLicense.license.token
              }
            };
          } catch (error) {
            // If heartbeat fails, request new license
            console.log('Cached license invalid, requesting new one');
            licenseResponse = await drmService.requestLicense(params.id as string);
            if (!isMounted) return;

            // Cache the new license
            await setCachedLicense(params.id as string, {
              uploadId: params.id as string,
              license: {
                token: licenseResponse.data.encryptedContentKey,
                sessionToken: licenseResponse.data.sessionToken,
                expiresAt: Date.now() + (60 * 60 * 1000) // Cache for 1 hour
              }
            });
          }
        } else {
          // No cached license, request new one
          licenseResponse = await drmService.requestLicense(params.id as string);
          if (!isMounted) return;

          // Cache the new license
          await setCachedLicense(params.id as string, {
            uploadId: params.id as string,
            license: {
              token: licenseResponse.data.encryptedContentKey,
              sessionToken: licenseResponse.data.sessionToken,
              expiresAt: Date.now() + (60 * 60 * 1000) // Cache for 1 hour
            }
          });
        }

        // Only proceed with content loading if not already loaded
        if (!isContentLoaded) {
          // Start heartbeat with session token
          startHeartbeat(licenseResponse.data.sessionToken);

          // Decrypt content key
          const contentKey = await drmService.decryptContentKey(licenseResponse.data.encryptedContentKey);
          if (!isMounted) return;
          const decoder = new TextDecoder();
          const keyString = decoder.decode(contentKey);
          console.log('Content Key (UUID):', keyString);
          
          // Fetch encrypted content
          const contentResponse = await drmService.fetchEncryptedContent(params.id as string, licenseResponse.data.sessionToken);
          if (!isMounted) return;
          console.log('Content Response Headers:', JSON.stringify(contentResponse.headers, null, 2));
          
          let contentType = contentResponse.headers['content-type'];
          const encryptedContentBuffer = contentResponse.data;
          
          // Get file type from Content-Disposition header
          const contentDisposition = contentResponse.headers['content-disposition'];
          console.log('Content-Disposition:', contentDisposition);
          
          let detectedFileType = '';
          
          if (contentDisposition) {
              const match = contentDisposition.match(/filename="file\.([^"]+)"/);
              console.log('match:', match);
              if (match) {
                  detectedFileType = match[1].toLowerCase();
                  console.log('File type from Content-Disposition:', detectedFileType);
                  
                  let currentFileType: 'pdf' | 'docx' | 'html' | null = null;
                  
                  // Map file extension to MIME type
                  if (detectedFileType.includes('pdf')) {
                      contentType = 'application/pdf';
                      currentFileType = 'pdf';
                      console.log('✅ Setting content type to PDF');
                  } else if (detectedFileType.includes('openxmlformats-officedocument.wordprocessingml.document')) {
                      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                      currentFileType = 'docx';
                      console.log('✅ Setting content type to DOCX');
                  } else if (detectedFileType === 'doc') {
                      contentType = 'application/msword';
                      currentFileType = 'docx';
                      console.log('✅ Setting content type to DOC');
                  } else if (detectedFileType.includes('html')) {
                      currentFileType = 'html';
                      console.log('✅ Setting content type to HTML');
                  } else {
                      console.error('❌ Unsupported file type:', detectedFileType);
                      throw new Error(`Unsupported file type: ${detectedFileType}`);
                  }
                  
                  if (!isMounted) return;
                  setFileType(currentFileType);
                  console.log('file Type:', currentFileType);
                  
                  // Use drmService's decryptContentToFile
                  const decryptedFilePath = await drmService.decryptContentToFile(
                      encryptedContentBuffer, 
                      keyString,
                      currentFileType
                  );
                  if (!isMounted) return;
                  console.log("Decrypted file path:", decryptedFilePath);
                  
                  console.log('Final content type(1):', contentType);
              
                  // Set the local file path directly from the decrypted file
                  setLocalFilePath(decryptedFilePath);
                  console.log('File ready for display:', decryptedFilePath);
              }
          }

          // After successful decryption, cache the content
          if (localFilePath && fileType) {
            setIsContentLoaded(true);
          }

        }

      } catch (error) {
        if (isMounted) {
          console.error('❌ Error in document processing:', error);
          setError('Không thể tải tài liệu. Vui lòng thử lại sau.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAndDecryptDocument();

    return () => {
      isMounted = false;
    };
  }, [keys, params.id]);

  const handleBack = () => {
    router.back();
  };

  const handleSaveFile = async () => {
    if (!localFilePath) return;
    
    try {
      if (Platform.OS === 'android') {
        // Get the file name from the path
        const fileName = localFilePath.split('/').pop();
        
        // Check file size and format
        const fileInfo = await FileSystem.getInfoAsync(localFilePath);
        if (!fileInfo.exists || fileInfo.size < 1000) {
          Alert.alert('Lỗi', 'File không hợp lệ hoặc quá nhỏ');
          return;
        }

        // Read first few bytes to check PDF header
        const fileContent = await FileSystem.readAsStringAsync(localFilePath, {
          encoding: FileSystem.EncodingType.Base64,
          length: 5
        });
        const pdfHeader = atob(fileContent);
        if (pdfHeader !== '%PDF-') {
          Alert.alert('Lỗi', 'File không phải định dạng PDF hợp lệ');
          return;
        }
        
        // For Android 10+ (API level 29+), use MediaStore
        if (Platform.Version >= 29) {
          const destinationPath = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.copyAsync({
            from: localFilePath,
            to: destinationPath
          });
          
          // Use MediaLibrary to save to Downloads
          const asset = await MediaLibrary.createAssetAsync(destinationPath);
          await MediaLibrary.createAlbumAsync('Download', asset, false);
          
          Alert.alert(
            'Thành công',
            'File đã được lưu vào thư mục Downloads',
            [{ text: 'OK' }]
          );
        } else {
          // For older Android versions, use direct path
          const destinationPath = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.copyAsync({
            from: localFilePath,
            to: destinationPath
          });
          
          Alert.alert(
            'Thành công',
            `File đã được lưu tại: ${destinationPath}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error saving file:', error);
      Alert.alert('Lỗi', 'Không thể lưu file');
    }
  };

  const handleOpenDoc = async () => {
    if (!localFilePath) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(localFilePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: 'Open Document',
          UTI: 'com.microsoft.word.doc' // iOS only
        });
      } else {
        Alert.alert('Lỗi', 'Không thể mở tài liệu trong ứng dụng bên ngoài');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Lỗi', 'Không thể mở tài liệu');
    }
  };

  const renderWordDocument = () => {
    if (!localFilePath) return null;
    
    // Convert local file to base64
    const fileUri = `file://${localFilePath}`;
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUri)}`;
    
    return (
      <WebView
        source={{ uri: officeViewerUrl }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Đang tải tài liệu...
            </Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          Alert.alert(
            'Lỗi',
            'Không thể hiển thị tài liệu. Vui lòng thử lại sau.',
            [{ text: 'OK' }]
          );
        }}
      />
    );
  };

  useEffect(() => {
    let isMounted = true;
    const convertAndDisplayWord = async () => {
      if (!localFilePath || !isMounted) return;
      
      try {
        if (!isMounted) return;
        setLoading(true);
        console.log('Starting conversion from:', localFilePath);
        
        const htmlPath = await convertDocxToHtml(localFilePath);
        if (!isMounted) return;
        console.log('Converted HTML path:', htmlPath);
        
        // Read the HTML content
        const htmlContent = await FileSystem.readAsStringAsync(htmlPath);
        if (!isMounted) return;
        console.log('HTML content length:', htmlContent.length);
        
        // Update the file path and type
        setLocalFilePath(htmlPath);
        setFileType('html');
        setHtmlContent(htmlContent);
        
        console.log('Conversion completed successfully');
      } catch (error) {
        if (isMounted) {
          console.error('Error converting document:', error);
          Alert.alert(
            'Lỗi',
            'Không thể chuyển đổi tài liệu. Vui lòng thử lại sau.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (localFilePath && fileType === 'docx') {
      convertAndDisplayWord();
    }

    return () => {
      isMounted = false;
    };
  }, [localFilePath, fileType]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={[styles.backButton, { backgroundColor: '#FFFFFF' }]}
            >
              <Ionicons name="arrow-back" size={22} color="#333333" />
            </TouchableOpacity>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.headerInfo}
            >
              <View>
                <Text style={[styles.documentName, { color: '#333333' }]}>
                  {params.documentName || 'Tài liệu'}
                </Text>
                <Text style={[styles.author, { color: '#666666' }]} numberOfLines={1}>
                  {params.author || 'Không có tác giả'}
                </Text>
              </View>
            </ScrollView>
          </View>
          <View style={styles.headerRight}>
            {fileType === 'pdf' && !loading && (
              <View style={[styles.pageInfo, { backgroundColor: '#E8E8E8' }]}>
                <Ionicons name="document-text-outline" size={16} color="#333333" style={styles.pageIcon} />
                <Text style={[styles.pageText, { color: '#333333' }]}>
                  {currentPage} / {totalPages}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              onPress={handleSaveFile} 
              style={[styles.headerButton, { backgroundColor: '#E8E8E8' }]}
            >
              <Ionicons name="download-outline" size={22} color="#333333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {fileType === 'docx' ? 'Đang chuyển đổi tài liệu...' : 'Đang tải tài liệu...'}
            </Text>
          </View>
        ) : error ? (
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
        ) : localFilePath ? (
          fileType === 'pdf' ? (
            <Pdf
              source={{ uri: `file://${localFilePath}` }}
              style={styles.pdf}
              onLoadComplete={(numberOfPages, filePath) => {
                console.log(`Number of pages: ${numberOfPages}`);
                setTotalPages(numberOfPages);
                setCurrentPage(1);
              }}
              onPageChanged={(page, numberOfPages) => {
                console.log(`Current page: ${page}`);
                setCurrentPage(page);
                if (numberOfPages !== totalPages) {
                  setTotalPages(numberOfPages);
                }
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
          ) : fileType === 'html' && htmlContent ? (
            <WebView
              source={{ html: htmlContent }}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Đang tải tài liệu...
                  </Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert(
                  'Lỗi',
                  'Không thể hiển thị tài liệu. Vui lòng thử lại sau.',
                  [{ text: 'OK' }]
                );
              }}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Đang chuyển đổi tài liệu...
              </Text>
            </View>
          )
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>
              Không tìm thấy tài liệu
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  documentName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  author: {
    fontSize: 15,
    opacity: 0.8,
    letterSpacing: 0.2,
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pageIcon: {
    marginRight: 8,
  },
  pageText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerButton: {
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#f0f0f0',
  },
  webview: {
    flex: 1,
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
  content: {
    flex: 1,
  },
});

export default DocumentViewer; 