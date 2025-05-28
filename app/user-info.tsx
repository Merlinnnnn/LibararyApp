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
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface UserInfoDisplay {
  fullName: string;
  email: string;
  phone: string; // Assuming phone number can be edited
  address: string; // Assuming address can be edited
  avatar: string; // Assuming avatar can be updated
}

export const metadata = {
    title: 'Thông tin cá nhân',
  };

export default function UserInfoScreen() {
  const colorScheme = useColorScheme() || 'light';
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true); // Set to true initially to show loading state
  const [userInfo, setUserInfo] = useState<UserInfoDisplay>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '' // Default or placeholder avatar
  });
  const [originalUserInfo, setOriginalUserInfo] = useState<UserInfoDisplay | null>(null); // To store original data for cancelling edits

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      try {
        const response = await userService.getUserInfo();
        if (response.data && response.data.success && response.data.data) {
          const userData = response.data.data; 
          const formattedUserInfo: UserInfoDisplay = {
            fullName: `${userData.firstName} ${userData.lastName}`,
            email: userData.username, 
            phone: userData.phoneNumber,
            address: userData.address,
            avatar: userData.avatar || 'https://img6.thuthuatphanmem.vn/uploads/2022/11/18/anh-avatar-don-gian-cho-nu_081757692.jpg'
          };
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

  const handleSave = async () => {
    Alert.alert('Thông báo', 'Chức năng lưu thông tin đang được phát triển.');
    setIsEditing(false);
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
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Họ và tên</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                    //borderColor: Colors[colorScheme].border
                  }
                ]}
                value={userInfo.fullName}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, fullName: text }))}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                    //borderColor: Colors[colorScheme].border
                  }
                ]}
                value={userInfo.email}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Số điện thoại</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    color: Colors[colorScheme].text,
                    //borderColor: Colors[colorScheme].border
                  }
                ]}
                value={userInfo.phone}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, phone: text }))}
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
                    //borderColor: Colors[colorScheme].border
                  }
                ]}
                value={userInfo.address}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, address: text }))}
                editable={isEditing}
                multiline
                numberOfLines={3}
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