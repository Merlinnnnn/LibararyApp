import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { userService } from '../services/user/user.service';
import { UserDetail } from '../services/types/user.types';
import { UpdateProfileRequest } from '../services/types/request.types';
import { APIResponse } from '../services/types/common.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Function to get the authentication token (using AsyncStorage as example)
const getAuthToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        return token;
    } catch (error) {
        console.error('Error retrieving auth token:', error);
        return null;
    }
};

// Update UserDetail type to include new fields
interface ExtendedUserDetail {
  firstName: string;
  lastName: string;
  dob: string | null;
  phoneNumber: string;
  address: string;
  majorCode: string;
  studentBatch: number;
  avatar: string;
}

interface UserInfoDisplay {
  firstName: string;
  lastName: string;
  dob: Date;
  phoneNumber: string;
  address: string;
  studentBatch: string;
  majorCode: string;
  avatar: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const metadata = {
    title: 'Thông tin cá nhân',
  };

export default function UserInfoScreen() {
  const colorScheme = useColorScheme() || 'light';
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoDisplay>({
    firstName: '',
    lastName: '',
    dob: new Date(),
    phoneNumber: '',
    address: '',
    studentBatch: '',
    majorCode: '',
    avatar: ''
  });
  const [originalUserInfo, setOriginalUserInfo] = useState<UserInfoDisplay | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      try {
        const response = await userService.getUserInfo();
        console.log('API Response:', response.data); // Debug log
        if (response.data && response.data.success && response.data.data) {
          const userData = response.data.data;
          console.log('User Data:', userData); // Debug log
          const formattedUserInfo: UserInfoDisplay = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            dob: userData.dob ? new Date(userData.dob) : new Date(),
            phoneNumber: userData.phoneNumber || '',
            address: userData.address || '',
            studentBatch: userData.studentBatch?.toString() || '',
            majorCode: userData.majorCode || '', // Keep empty string as fallback for initial load
            avatar: 'https://img6.thuthuatphanmem.vn/uploads/2022/11/18/anh-avatar-don-gian-cho-nu_081757692.jpg'
          };
          console.log('Formatted User Info:', formattedUserInfo); // Debug log
          setUserInfo(formattedUserInfo);
          setOriginalUserInfo(formattedUserInfo);
        } else {
          Alert.alert('Lỗi', response.data?.message || 'Không thể lấy thông tin người dùng.');
        }
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi khi kết nối đến server.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const validateForm = (): boolean => {
    if (!userInfo.firstName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên');
      return false;
    }
    if (!userInfo.lastName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ');
      return false;
    }
    if (!userInfo.phoneNumber.match(/^(\+84|0)[0-9]{9,10}$/)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return false;
    }
    if (!userInfo.address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ');
      return false;
    }
    if (!userInfo.studentBatch.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập khóa học');
      return false;
    }
    if (!userInfo.majorCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã chuyên ngành');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const updateData: UpdateProfileRequest = {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        dob: userInfo.dob.toISOString().split('T')[0],
        phoneNumber: userInfo.phoneNumber,
        address: userInfo.address,
        studentBatch: parseInt(userInfo.studentBatch),
        majorCode: userInfo.majorCode // Remove the || '' here to keep the actual value
      };

      console.log('Update Data:', updateData); // Debug log

      // Get userId from AsyncStorage
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (!userInfoStr) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }
      const userInfoData = JSON.parse(userInfoStr);
      const userId = userInfoData.userId;

      const response = await userService.updateProfile(userId, updateData);
      console.log('Update Response:', response.data); // Debug log
      const apiResponse = response.data as unknown as ApiResponse<UserDetail>;
      
      if (apiResponse.success) {
        // Fetch latest user info after successful update
        const latestUserInfo = await userService.getUserInfo();
        console.log('Latest User Info:', latestUserInfo.data); // Debug log
        if (latestUserInfo.data && latestUserInfo.data.success && latestUserInfo.data.data) {
          const userData = latestUserInfo.data.data;
          const formattedUserInfo: UserInfoDisplay = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            dob: userData.dob ? new Date(userData.dob) : new Date(),
            phoneNumber: userData.phoneNumber || '',
            address: userData.address || '',
            studentBatch: userData.studentBatch?.toString() || '',
            majorCode: userData.majorCode || userInfo.majorCode, // Use the value from form if API returns null
            avatar: 'https://img6.thuthuatphanmem.vn/uploads/2022/11/18/anh-avatar-don-gian-cho-nu_081757692.jpg'
          };
          console.log('Updated Formatted User Info:', formattedUserInfo); // Debug log
          setUserInfo(formattedUserInfo);
          setOriginalUserInfo(formattedUserInfo);

          // Update userInfo in AsyncStorage with new data
          const updatedUserInfo = {
            ...userInfoData,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            userId: userData.userId,
            username: userData.username,
            roles: userData.roles,
            isActive: userData.isActive,
            majorCode: userData.majorCode || userInfo.majorCode // Use the value from form if API returns null
          };
          await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        }
        
        Alert.alert('Thành công', 'Cập nhật thông tin thành công');
        setIsEditing(false);
      } else {
        Alert.alert('Lỗi', apiResponse.message || 'Không thể cập nhật thông tin');
      }
    } catch (error: any) {
      console.error('Update Error:', error); // Debug log
      Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi khi cập nhật thông tin');
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setUserInfo(prev => ({ ...prev, dob: selectedDate }));
    }
  };

  const handleCancelEdit = () => {
      if(originalUserInfo) {
          setUserInfo(originalUserInfo);
      }
      setIsEditing(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => isEditing ? handleCancelEdit() : router.back()}
        >
          <FontAwesome name={isEditing ? "times" : "arrow-left"} size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
          Thông tin cá nhân
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={loading} // Disable edit/save button while loading
        >
          <FontAwesome 
            name={isEditing ? "save" : "edit"} 
            size={24} 
            color={loading ? Colors[colorScheme].disabled : Colors[colorScheme].tint} 
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: userInfo.avatar || 'https://img6.thuthuatphanmem.vn/uploads/2022/11/18/anh-avatar-don-gian-cho-nu_081757692.jpg' }} // Fallback avatar
              style={styles.avatar}
            />
            {isEditing && (
              <TouchableOpacity style={styles.changeAvatarButton}>
                <FontAwesome name="camera" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Họ</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                  }
                ]}
                value={userInfo.lastName}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, lastName: text }))}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Tên</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                  }
                ]}
                value={userInfo.firstName}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, firstName: text }))}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Ngày sinh</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                  }
                ]}
                onPress={() => isEditing && setShowDatePicker(true)}
                disabled={!isEditing}
              >
                <Text style={{ color: Colors[colorScheme].text }}>
                  {userInfo.dob.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={userInfo.dob}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Số điện thoại</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                  }
                ]}
                value={userInfo.phoneNumber}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, phoneNumber: text }))}
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Địa chỉ</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                  }
                ]}
                value={userInfo.address}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, address: text }))}
                editable={isEditing}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Khóa học</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                  }
                ]}
                value={userInfo.studentBatch}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, studentBatch: text }))}
                editable={isEditing}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Mã chuyên ngành</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                  }
                ]}
                value={userInfo.majorCode}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, majorCode: text }))}
                editable={isEditing}
              />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#204A9C',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
}); 