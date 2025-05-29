declare module 'react-native-drm-crypto' {
  interface DRMCrypto {
    encryptContent(content: string, contentKey: string): Promise<string>;
    decryptContent(encryptedContent: string, contentKey: string): Promise<string>;
  }

  const DRMCrypto: DRMCrypto;
  export default DRMCrypto;
} 