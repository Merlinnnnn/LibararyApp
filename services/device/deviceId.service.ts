import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getUniqueId, getManufacturer, getDeviceId, getModel, getSystemVersion, getBuildId } from 'react-native-device-info';

const DEVICE_ID_KEY = 'device_unique_id';

class DeviceIdService {
  private static instance: DeviceIdService;
  private deviceId: string | null = null;

  private constructor() {}

  public static getInstance(): DeviceIdService {
    if (!DeviceIdService.instance) {
      DeviceIdService.instance = new DeviceIdService();
    }
    return DeviceIdService.instance;
  }

  private async generateDeviceId(): Promise<string> {
    try {
      // Lấy các thông tin phần cứng cố định của thiết bị
      const uniqueId = await getUniqueId(); // ID duy nhất của thiết bị
      const manufacturer = await getManufacturer(); // Nhà sản xuất
      const deviceId = await getDeviceId(); // ID thiết bị
      const model = getModel(); // Model thiết bị
      const systemVersion = getSystemVersion(); // Phiên bản hệ điều hành
      const buildId = getBuildId(); // ID build của hệ điều hành

      // Kết hợp các thông tin cố định để tạo deviceId
      const deviceInfo = {
        uniqueId,
        manufacturer,
        deviceId,
        model,
        systemVersion,
        buildId,
        platform: Platform.OS,
      };

      // Tạo hash từ thông tin thiết bị
      const deviceInfoString = JSON.stringify(deviceInfo);
      const deviceIdHash = await this.hashString(deviceInfoString);

      // Lưu deviceId vào SecureStore
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceIdHash);

      return deviceIdHash;
    } catch (error) {
      console.error('Error generating device ID:', error);
      throw new Error('Failed to generate device ID');
    }
  }

  private async hashString(str: string): Promise<string> {
    // Sử dụng một thuật toán hash đơn giản
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  public async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    try {
      // Thử lấy deviceId đã lưu
      const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      
      if (storedDeviceId) {
        this.deviceId = storedDeviceId;
        return storedDeviceId;
      }

      // Nếu chưa có, tạo mới
      const newDeviceId = await this.generateDeviceId();
      this.deviceId = newDeviceId;
      return newDeviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      throw new Error('Failed to get device ID');
    }
  }

  public async refreshDeviceId(): Promise<string> {
    this.deviceId = null;
    return this.getDeviceId();
  }
}

export const deviceIdService = DeviceIdService.getInstance(); 