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
import * as IntentLauncher from 'expo-intent-launcher';

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
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

async function deriveAesKey(contentKey: string, salt: ArrayBuffer | Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(contentKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltUint8 = new Uint8Array(salt as ArrayBuffer);

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltUint8,
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function decryptContentBufferToBuffer(encryptedBuffer: ArrayBuffer, contentKey: string): Promise<ArrayBuffer> {
  const salt = new Uint8Array(encryptedBuffer.slice(0, 16));
  const iv = new Uint8Array(encryptedBuffer.slice(16, 28));
  const ciphertext = encryptedBuffer.slice(28);

  const aesKey = await deriveAesKey(contentKey, salt);
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );
}

export default function DigitalViewerScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() || 'light';
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<{
    publicKey: string;
    privateKey: string;
    privateKeyRaw: CryptoKey;
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
        console.log('Content Key (base64):', arrayBufferToBase64(contentKey));
        
        // Fetch encrypted content
        const contentResponse = await drmService.fetchEncryptedContent(id as string, licenseResponse.data.sessionToken);
        console.log('Content Response Headers:', JSON.stringify(contentResponse.headers, null, 2));
        console.log('Content Response Data Length:', contentResponse.data.byteLength);
        
        // Get file type from Content-Disposition header
        const contentDisposition = contentResponse.headers['content-disposition'] || contentResponse.headers['Content-Disposition'];
        console.log('Content-Disposition:', contentDisposition);
        
        let contentType = contentResponse.headers['content-type'] || contentResponse.headers['Content-Type'];
        console.log('Original Content-Type:', contentType);
        
        let fileType = '';
        
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="file\.(\w+)"/);
            if (match) {
                fileType = match[1].toLowerCase();
                console.log('File type from Content-Disposition:', fileType);
                
                // Map file extension to MIME type
                switch (fileType) {
                    case 'pdf':
                        contentType = 'application/pdf';
                        console.log('✅ Setting content type to PDF');
                        break;
                    case 'docx':
                        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        break;
                    case 'doc':
                        contentType = 'application/msword';
                        break;
                    default:
                        console.error('❌ Unsupported file type:', fileType);
                        throw new Error(`Unsupported file type: ${fileType}`);
                }
            }
        } else {
            console.log('No Content-Disposition header found, will try to detect from content');
        }
        
        // Decrypt content first
        try {
            console.log('Starting decryption process...');
            console.log('Content key length:', contentKey.byteLength);
            console.log('Encrypted content length:', contentResponse.data.byteLength);
            
            const decryptedBuffer = await drmService.decryptContent(contentResponse.data, contentKey);
            console.log('Decryption successful');
            console.log('Decrypted Buffer Length:', decryptedBuffer.byteLength);
            
            // Verify decrypted content
            const fileBytes = new Uint8Array(decryptedBuffer);
            console.log('First 10 bytes of decrypted file:', Array.from(fileBytes.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
            
            // If no file type from Content-Disposition, try to detect from content
            if (true) {
                const isPDF = fileBytes[0] === 0x25 && fileBytes[1] === 0x50; // %P
                const isWord = fileBytes[0] === 0x50 && fileBytes[1] === 0x4B; // PK
                
                if (1) {
                    fileType = 'pdf';
                    contentType = 'application/pdf';
                    console.log('✅ PDF detected from content');
                } else if (isWord) {
                    fileType = 'docx';
                    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    console.log('✅ Word detected from content');
                } else {
                    console.error('❌ Unable to detect file type from content. First bytes:', 
                        Array.from(fileBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                    throw new Error('Unsupported file type');
                }
            }
            
            console.log('Final content type:', contentType);
            
            // Create blob URL and save to local file
            const url = await drmService.createBlobUrl(decryptedBuffer, contentType);
            console.log('Created blob URL:', url);
            
            setFileType(contentType);
            setBookContentUrl(url);

            // Save to local file for native viewing
            if (Platform.OS === 'android') {
              const fileName = `document_${Date.now()}.${fileType === 'application/pdf' ? 'pdf' : 'docx'}`;
              const filePath = `${FileSystem.cacheDirectory}${fileName}`;
              
              // Convert ArrayBuffer to Base64
              const base64 = arrayBufferToBase64(decryptedBuffer);
              
              // Write to file
              await FileSystem.writeAsStringAsync(filePath, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              setLocalFilePath(filePath);
              console.log('File saved to:', filePath);
            }
        } catch (decryptError) {
            console.error('Decryption Error Details:', decryptError);
            throw decryptError;
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

  if (Platform.OS === 'android' && localFilePath) {
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
        <View style={styles.androidContainer}>
          <Text style={[styles.androidText, { color: Colors[colorScheme].text }]}>
            Document is ready to view
          </Text>
          <TouchableOpacity
            style={[styles.openButton, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={openDocument}
          >
            <Text style={styles.openButtonText}>Open Document</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // For iOS and web, show a message that viewing is not supported
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
      <View style={styles.messageContainer}>
        <Text style={[styles.messageText, { color: Colors[colorScheme].text }]}>
          Document viewing is currently only supported on Android devices.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  androidContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  androidText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  openButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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