import { getApiUrl } from '../config/api.config';
import api from '../config/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RSA from 'react-native-rsa-native';
import { NativeModules } from 'react-native';
import { Buffer } from 'buffer';
import { StringChain } from 'lodash';
import { deviceIdService } from '../device/deviceId.service';

const { DRMCrypto } = NativeModules;

if (!DRMCrypto) {
  console.error('DRMCrypto native module is not available');
}

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
  };
  

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
    const keys = await RSA.RSA.generateKeys(2048);
    return {
      publicKey: keys.public,
      privateKey: keys.private,
      privateKeyRaw: keys.private,
    };
  }

  async initializeSecureEnvironment(): Promise<{
    publicKey: string;
    privateKey: string;
    privateKeyRaw: string;
  }> {
    const storedPrivateKey = await AsyncStorage.getItem(KEY_STORAGE.PRIVATE_KEY);
    const storedPublicKey = await AsyncStorage.getItem(KEY_STORAGE.PUBLIC_KEY);

    if (storedPrivateKey && storedPublicKey) {
      this.privateKey = storedPrivateKey;
      this.publicKey = storedPublicKey;
      return {
        publicKey: storedPublicKey,
        privateKey: storedPrivateKey,
        privateKeyRaw: storedPrivateKey,
      };
    }

    const keys = await this.generateRSAKeys();
    await AsyncStorage.setItem(KEY_STORAGE.PRIVATE_KEY, keys.privateKey);
    await AsyncStorage.setItem(KEY_STORAGE.PUBLIC_KEY, keys.publicKey);
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;

    return keys;
  }

  async requestLicense(bookId: string): Promise<LicenseResponse> {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }

    const deviceId = await deviceIdService.getDeviceId();
    console.log('deviceId', deviceId);
    const response = await api.post<LicenseResponse>(
      getApiUrl(`/api/v1/drm/license/android`),
      {
        publicKey: this.publicKey,
        uploadId: bookId,
        deviceId: deviceId,
      }
    );

    return response.data;
  }

  async decryptContentKey(encryptedContentKey: string): Promise<Uint8Array> {
    if (!this.privateKey) {
      throw new Error('Private key not initialized');
    }

    const decrypted = await RSA.RSA.decrypt(encryptedContentKey, this.privateKey);
    const encoder = new TextEncoder();
    return encoder.encode(decrypted);
  }

  async fetchEncryptedContent(uploadId: string, sessionToken: string): Promise<ContentResponse> {
    const response = await api.get<ArrayBuffer>(
      getApiUrl(`/api/v1/drm/content/${uploadId}`),
      {
        headers: { 'X-Session-Token': sessionToken },
        responseType: 'arraybuffer',
      }
    );

    console.log('Received binary data size:', response.data.byteLength);
    return {
      data: response.data,
      headers: {
        'content-type': response.headers['content-type'],
        'content-disposition': response.headers['content-disposition'],
      },
    };
  }

  async createBlobUrl(content: Uint8Array, contentType: string): Promise<string> {
    const base64 = this.arrayBufferToBase64(content.buffer as ArrayBuffer);
    return `data:${contentType};base64,${base64}`;
  }

  async decryptContentToFile(
    encryptedContent: ArrayBuffer,
    contentKey: string,
    fileType: string
  ): Promise<string>   {
     if (!DRMCrypto) {
      throw new Error('DRMCrypto native module is not available');
    }

    try {
      const base64Content = this.arrayBufferToBase64(encryptedContent);
      console.log("📤 Encrypted base64 length:", base64Content.length);
      
      // 🔓 B2: Gọi native module để giải mã
      const filePath: string = await DRMCrypto.decryptContent(
        base64Content,
        contentKey,
        fileType
      );
      console.log('📁 Decrypted file saved at:', filePath);

      // B3: Android yêu cầu prefix `file://`, iOS không
      const finalPath =`file://${filePath}`

      return finalPath;
    } catch (error) {
      console.error('❌ Error in decryptContentToFile:', error);
      throw error;
    }
  }

  async fetchDecryptedContent(uploadId: StringChain): Promise<ContentResponse> {
    const response = await api.get<ArrayBuffer>(
      getApiUrl(`/api/documents/${uploadId}/decrypted`),
      {
        responseType: 'arraybuffer',
      }
    );

    return {
      data: response.data,
      headers: {
        'content-type': response.headers['content-type'],
        'content-disposition': response.headers['content-disposition'],
      },
    };
  }

  async updateHeartbeat(sessionToken: string): Promise<void> {
    await api.post(
      getApiUrl('/api/v1/drm/heartbeat'),
      { sessionToken }
    );
  }
}

export const drmService = DRMService.getInstance();
