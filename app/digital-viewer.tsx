import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { drmService } from '../services/book/drm.service';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
// import * as IntentLauncher from 'expo-intent-launcher';
import Pdf from 'react-native-pdf';
// import DocViewer from 'react-native-doc-viewer';

const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const generateRSAKeysInBrowser = async (): Promise<{
  publicKey: string;
  privateKey: string;
  privateKeyRaw: CryptoKey;
}> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKeyBuffer),
    privateKey: arrayBufferToBase64(privateKeyBuffer),
    privateKeyRaw: keyPair.privateKey,
  };
};

interface LicenseResponse {
  data: {
    encryptedContentKey: string;
  };
}


export default function DigitalViewerScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() || 'light';
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<{
    publicKey: string;
    privateKey: string;
    privateKeyRaw: string;
  } | null>(null);
  const [bookContentUrl, setBookContentUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [localFilePath, setLocalFilePath] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const initKeys = async () => {
      try {
        const generatedKeys = await drmService.initializeSecureEnvironment();
        setKeys(generatedKeys);
      } catch (error) {
        console.error('❌ Error generating RSA keys:', error);
        setError('Failed to initialize secure reading environment');
      } finally {
        setLoading(false);
      }
    };
    if (id) initKeys();
  }, [id]);

  useEffect(() => {
    const fetchAndDecryptDocument = async () => {
      if (!keys || !id) return;
      try {
        // Request license
        const licenseResponse = await drmService.requestLicense(id as string);
        console.log('License Response:', licenseResponse);
        
        // Decrypt content key
        const contentKey = await drmService.decryptContentKey(licenseResponse.data.encryptedContentKey);
        const decoder = new TextDecoder();
        const keyString = decoder.decode(contentKey);
        console.log('Content Key (UUID):', keyString);
        
        // Fetch encrypted content
        const contentResponse = await drmService.fetchEncryptedContent(id as string, licenseResponse.data.sessionToken);
        console.log('Content Response Headers:', JSON.stringify(contentResponse.headers, null, 2));
        
        let contentType = contentResponse.headers['content-type'];
        const encryptedContentBuffer = contentResponse.data;
        
        // Use drmService's decryptContent
        const decryptedContentBuffer = await drmService.decryptContent(encryptedContentBuffer, keyString);
        
        // Debug: Check first few bytes of decrypted content
        const fileBytes = new Uint8Array(decryptedContentBuffer);
        console.log('First 10 bytes of decrypted file:', Array.from(fileBytes.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        // Get file type from Content-Disposition header
        const contentDisposition = contentResponse.headers['content-disposition'];
        console.log('Content-Disposition:', contentDisposition);
        
        let detectedFileType = '';
        
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="file\.(\w+)"/);
            if (match) {
                detectedFileType = match[1].toLowerCase();
                console.log('File type from Content-Disposition:', detectedFileType);
                
                // Map file extension to MIME type
                switch (detectedFileType) {
                    case 'pdf':
                        contentType = 'application/pdf';
                        setFileType('application/pdf');
                        console.log('✅ Setting content type to PDF');
                        break;
                    case 'docx':
                        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        setFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                        break;
                    case 'doc':
                        contentType = 'application/msword';
                        setFileType('application/msword');
                        break;
                    default:
                        console.error('❌ Unsupported file type:', detectedFileType);
                        throw new Error(`Unsupported file type: ${detectedFileType}`);
                }
            }
        }
        
        // Verify PDF header
        if (contentType === 'application/pdf') {
            const pdfHeader = new Uint8Array(decryptedContentBuffer.slice(0, 5));
            const pdfHeaderStr = String.fromCharCode.apply(null, Array.from(pdfHeader));
            console.log('PDF Header:', pdfHeaderStr);
            
            if (pdfHeaderStr !== '%PDF-') {
                console.error('Invalid PDF header:', pdfHeaderStr);
                throw new Error('Invalid PDF format');
            }
        }
        
        console.log('Final content type:', contentType);
        
        // Save to local file for native viewing
        if (Platform.OS === 'android') {
          const fileName = `document_${Date.now()}.${detectedFileType || 'pdf'}`;
          const filePath = `${FileSystem.cacheDirectory}${fileName}`;
          
          // Convert ArrayBuffer to Base64
          const base64 = arrayBufferToBase64(decryptedContentBuffer);
          
          // Write to file
          await FileSystem.writeAsStringAsync(filePath, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          setLocalFilePath(filePath);
          console.log('File saved to:', filePath);
          
          // Debug: Verify file exists and size
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          console.log('File info:', fileInfo);
        }
      } catch (error) {
        console.error('❌ Error in document processing:', error);
        setError('Failed to load document');
      }
    };
    fetchAndDecryptDocument();
  }, [keys, id]);

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript(`
      document.body.style.zoom = (document.body.style.zoom || 1) * 1.1;
      true;
    `);
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript(`
      document.body.style.zoom = (document.body.style.zoom || 1) * 0.9;
      true;
    `);
  };

  const openDocument = async () => {
    if (!localFilePath) return;

    try {
      if (Platform.OS === 'android') {
        const mimeType = fileType === 'application/pdf' 
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: `file://${localFilePath}`,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      }
    } catch (error) {
      console.error('Error opening document:', error);
      setError('Failed to open document');
    }
  };

  const renderDocument = () => {
    if (!localFilePath) return null;
    console.log('File Type:', fileType);
    
    //if (fileType === 'application/pdf') 
    if(1){
      return (
        <Pdf
          source={{ uri: localFilePath }}
          style={styles.pdf}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Current page: ${page}`);
          }}
          onError={(error) => {
            console.log('PDF Error:', error);
            setError('Failed to load PDF document');
          }}
        />
      );
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      // For Word documents, use the openDoc method
      // DocViewer.openDoc([{
      //   url: localFilePath,
      //   fileName: `document_${Date.now()}.${fileType.includes('docx') ? 'docx' : 'doc'}`,
      //   cache: true
      // }], (error) => {
      //   if (error) {
      //     console.log('Document Error:', error);
      //     setError('Failed to load document');
      //   }
      // });
      
      return (
        <View style={styles.messageContainer}>
          <Text style={[styles.messageText, { color: Colors[colorScheme].text }]}>
            Opening document...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.messageContainer}>
        <Text style={[styles.messageText, { color: Colors[colorScheme].text }]}>
          Unsupported file type
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme].text }]}>
          Initializing secure reading environment...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.errorText, { color: Colors[colorScheme].text }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Stack.Screen 
        options={{
          title: 'Document Viewer',
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
        }} 
      />
      <View style={styles.documentContainer}>
        {renderDocument()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  documentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#f5f5f5',
  },
  docViewer: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    margin: 16,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 