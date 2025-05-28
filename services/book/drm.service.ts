import { getApiUrl } from '../config/api.config';
import api from '../config/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as RSA from 'react-native-rsa-native';

interface LicenseResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    licenseId: number;
    sessionToken: string;
    expiryDate: string;
    encryptedContentKey: string;
  };
}

interface ContentResponse {
  data: ArrayBuffer;
  headers: {
    'content-type': string;
    'content-disposition': string;
  };
}

const KEY_STORAGE = {
  PRIVATE_KEY: '@drm_private_key',
  PUBLIC_KEY: '@drm_public_key',
};

class DRMService {
  private static instance: DRMService;
  private privateKey: string | null = null;
  private publicKey: string | null = null;

  private constructor() {}

  static getInstance(): DRMService {
    if (!DRMService.instance) {
      DRMService.instance = new DRMService();
    }
    return DRMService.instance;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async generateRSAKeys(): Promise<{
    publicKey: string;
    privateKey: string;
    privateKeyRaw: string;
  }> {
    try {
      // Sử dụng react-native-rsa-native để tạo cặp khóa
      const keys = await RSA.RSA.generateKeys(2048);
      
      return {
        publicKey: keys.public,
        privateKey: keys.private,
        privateKeyRaw: keys.private
      };
    } catch (error) {
      console.error('Failed to generate RSA keys:', error);
      throw error;
    }
  }

  async initializeSecureEnvironment(): Promise<{
    publicKey: string;
    privateKey: string;
    privateKeyRaw: string;
  }> {
    try {
      // Check if keys exist in storage
      const storedPrivateKey = await AsyncStorage.getItem(KEY_STORAGE.PRIVATE_KEY);
      const storedPublicKey = await AsyncStorage.getItem(KEY_STORAGE.PUBLIC_KEY);

      if (storedPrivateKey && storedPublicKey) {
        this.privateKey = storedPrivateKey;
        this.publicKey = storedPublicKey;
        return {
          publicKey: storedPublicKey,
          privateKey: storedPrivateKey,
          privateKeyRaw: storedPrivateKey
        };
      }

      // Generate new RSA key pair
      const keys = await this.generateRSAKeys();
      
      // Store keys
      await AsyncStorage.setItem(KEY_STORAGE.PRIVATE_KEY, keys.privateKey);
      await AsyncStorage.setItem(KEY_STORAGE.PUBLIC_KEY, keys.publicKey);

      this.privateKey = keys.privateKey;
      this.publicKey = keys.publicKey;

      return {
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        privateKeyRaw: keys.privateKey
      };
    } catch (error) {
      console.error('Failed to initialize secure environment:', error);
      throw error;
    }
  }

  async requestLicense(bookId: string): Promise<LicenseResponse> {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }

    const response = await api.post<LicenseResponse>(
      getApiUrl(`/api/v1/drm/license`),
      {
        publicKey: this.publicKey,
        uploadId: bookId,
        deviceId: '123',
      }
    );

    return response.data;
  }

  async decryptContentKey(encryptedContentKey: string): Promise<Uint8Array> {
    if (!this.privateKey) {
      throw new Error('Private key not initialized');
    }

    try {
      // Sử dụng react-native-rsa-native để giải mã
      const decrypted = await RSA.RSA.decrypt(encryptedContentKey, this.privateKey);
      
      // Chuyển đổi string thành Uint8Array
      const encoder = new TextEncoder();
      return encoder.encode(decrypted);
    } catch (error) {
      console.error('Failed to decrypt content key:', error);
      throw error;
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async fetchEncryptedContent(uploadId: string, sessionToken: string): Promise<ContentResponse> {
    const response = await api.get<ArrayBuffer>(
      getApiUrl(`/api/v1/drm/content/${uploadId}`),
      {
        headers: {
          'X-Session-Token': sessionToken,
        },
        responseType: 'arraybuffer'
      }
    );

    return {
      data: response.data,
      headers: {
        'content-type': response.headers['content-type'],
        'content-disposition': response.headers['content-disposition']
      }
    };
  }

  async decryptContent(
    encryptedContent: ArrayBuffer,
    contentKey: ArrayBuffer
  ): Promise<Uint8Array> {
    try {
      // Convert ArrayBuffer to string (UUID)
      const decoder = new TextDecoder();
      const keyString = decoder.decode(contentKey);
      console.log('Content key (UUID):', keyString);

      // Extract salt, IV and ciphertext from encrypted content
      const salt = new Uint8Array(encryptedContent.slice(0, 16));
      const iv = new Uint8Array(encryptedContent.slice(16, 28));
      const ciphertext = encryptedContent.slice(28);

      // Use expo-crypto for decryption
      const decrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        keyString + iv.toString()
      );

      const encoder = new TextEncoder();
      return encoder.encode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  async createBlobUrl(content: Uint8Array, contentType: string): Promise<string> {
    const blob = new Blob([content], { type: contentType });
    return URL.createObjectURL(blob);
  }

  async encryptForPublicKey(plaintext: string, base64PublicKey: string): Promise<string> {
    try {
      // Sử dụng react-native-rsa-native để mã hóa
      const encrypted = await RSA.RSA.encrypt(plaintext, base64PublicKey);
      return encrypted;
    } catch (error) {
      console.error('Failed to encrypt with public key:', error);
      throw error;
    }
  }
}

export const drmService = DRMService.getInstance(); 