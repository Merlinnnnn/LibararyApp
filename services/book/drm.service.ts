import { getApiUrl } from '../config/api.config';
import api from '../config/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RSA from 'react-native-rsa-native';
import { NativeModules } from 'react-native';

const { DRMCrypto } = NativeModules;

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 10000;
const AES_KEY_LENGTH = 256;

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

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async generateRSAKeys(): Promise<{
    publicKey: string;
    privateKey: string;
    privateKeyRaw: string;
  }> {
    try {
      console.log('Generating new RSA keys...');
      const keys = await RSA.RSA.generateKeys(2048);
      console.log('Generated keys:', {
        publicKeyLength: keys.public.length,
        privateKeyLength: keys.private.length
      });   
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
      console.log('Initializing secure environment...');
      const storedPrivateKey = await AsyncStorage.getItem(KEY_STORAGE.PRIVATE_KEY);
      const storedPublicKey = await AsyncStorage.getItem(KEY_STORAGE.PUBLIC_KEY);
        
      console.log('Stored keys found:', {
        hasPrivateKey: !!storedPrivateKey,
        hasPublicKey: !!storedPublicKey,
        privateKeyLength: storedPrivateKey?.length,
        publicKeyLength: storedPublicKey?.length
      });

      if (storedPrivateKey && storedPublicKey) {
        console.log('Using existing keys from storage');
        this.privateKey = storedPrivateKey;
        this.publicKey = storedPublicKey;
        return {
          publicKey: storedPublicKey,
          privateKey: storedPrivateKey,
          privateKeyRaw: storedPrivateKey
        };
      }

      console.log('No existing keys found, generating new keys...');
      const keys = await this.generateRSAKeys();
      
      console.log('Saving new keys to storage...');
      await AsyncStorage.setItem(KEY_STORAGE.PRIVATE_KEY, keys.privateKey);
      await AsyncStorage.setItem(KEY_STORAGE.PUBLIC_KEY, keys.publicKey);

      this.privateKey = keys.privateKey;
      this.publicKey = keys.publicKey;

      console.log('Secure environment initialized successfully');
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
      getApiUrl(`/api/v1/drm/license/android`),
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
      console.error('Private key not initialized');
      throw new Error('Private key not initialized');
    }

    try {
      console.log('Decrypting content key...');
      console.log('Encrypted content key length:', encryptedContentKey.length);
      
      const decrypted = await RSA.RSA.decrypt(encryptedContentKey, this.privateKey);
      console.log('Decryption successful');
      
      const encoder = new TextEncoder();
      return encoder.encode(decrypted);
    } catch (error) {
      console.error('Failed to decrypt content key:', error);
      throw error;
    }
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

  async createBlobUrl(content: Uint8Array, contentType: string): Promise<string> {
    const base64 = this.arrayBufferToBase64(content.buffer as ArrayBuffer);
    return `data:${contentType};base64,${base64}`;
  }

  async encryptForPublicKey(plaintext: string, base64PublicKey: string): Promise<string> {
    try {
      console.log('Encrypting with public key...');
      console.log('Plaintext length:', plaintext.length);
      console.log('Public key length:', base64PublicKey.length);
      
      const encrypted = await RSA.RSA.encrypt(plaintext, base64PublicKey);
      console.log('Encryption successful');
      console.log('Encrypted data length:', encrypted.length);
      
      return encrypted;
    } catch (error) {
      console.error('Failed to encrypt with public key:', error);
      throw error;
    }
  }

  private async decryptChunk(chunk: string, privateKey: string): Promise<string> {
    try {
      return await RSA.RSA.decrypt(chunk, privateKey);
    } catch (error) {
      console.error('Failed to decrypt chunk:', error);
      throw error;
    }
  }

  async decryptWithPrivateKey(encryptedData: string): Promise<string> {
    try {
      if (!this.privateKey) {
        console.log('Private key not initialized');
        return "";
      }

      console.log('Decrypting with private key...');
      console.log('Encrypted data length:', encryptedData.length);

      const chunkSize = 256;
      const chunks: string[] = [];
      
      for (let i = 0; i < encryptedData.length; i += chunkSize) {
        chunks.push(encryptedData.slice(i, i + chunkSize));
      }

      console.log('Number of chunks:', chunks.length);

      const decryptedChunks = await Promise.all(
        chunks.map(chunk => this.decryptChunk(chunk, this.privateKey!))
      );

      const decrypted = decryptedChunks.join('');
      console.log('Decryption successful', decrypted);
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  async decryptContent(encryptedContent: ArrayBuffer, contentKey: string): Promise<ArrayBuffer> {
    try {
      const base64Content = this.arrayBufferToBase64(encryptedContent);
      const decryptedBase64 = await DRMCrypto.decryptContent(base64Content, contentKey);
      return this.base64ToArrayBuffer(decryptedBase64);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }
}

export const drmService = DRMService.getInstance(); 