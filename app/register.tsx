import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService } from '@/services/auth/auth.service';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // Ít nhất 6 ký tự, cho phép chữ cái, số và ký tự đặc biệt
    const passwordRegex = /^.{6,}$/;
    return passwordRegex.test(password);
  };

  const handleRegister = async () => {
    // Kiểm tra email trống
    if (!email) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập địa chỉ email của bạn.",
        [{ text: "Đồng ý" }]
      );
      return;
    }

    // Kiểm tra định dạng email
    if (!validateEmail(email)) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập địa chỉ email hợp lệ.",
        [{ text: "Đồng ý" }]
      );
      return;
    }

    // Kiểm tra mật khẩu trống
    if (!password) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập mật khẩu.",
        [{ text: "Đồng ý" }]
      );
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (!validatePassword(password)) {
      Alert.alert(
        "Thông báo",
        "Mật khẩu phải có ít nhất 6 ký tự.",
        [{ text: "Đồng ý" }]
      );
      return;
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      Alert.alert(
        "Thông báo",
        "Mật khẩu xác nhận không khớp.",
        [{ text: "Đồng ý" }]
      );
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({ 
        username: email, 
        password,
        confirmPassword 
      });
      
      if (response.success) {
        Alert.alert(
          "Đăng ký thành công",
          "Vui lòng kiểm tra email của bạn để xác thực tài khoản.",
          [
            {
              text: "Gửi lại email",
              onPress: async () => {
                try {
                  const resendResponse = await authService.resendVerificationEmail(email);
                  if (resendResponse.success) {
                    Alert.alert(
                      "Thông báo",
                      "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.",
                      [{ text: "Đồng ý" }]
                    );
                  } else {
                    Alert.alert(
                      "Lỗi",
                      resendResponse.message || "Không thể gửi lại email xác thực. Vui lòng thử lại sau.",
                      [{ text: "Đồng ý" }]
                    );
                  }
                } catch (error: any) {
                  Alert.alert(
                    "Lỗi",
                    error.message || "Không thể gửi lại email xác thực. Vui lòng thử lại sau.",
                    [{ text: "Đồng ý" }]
                  );
                }
              }
            },
            {
              text: "Đăng nhập",
              onPress: () => router.replace('/login')
            }
          ]
        );
      } else {
        Alert.alert(
          "Lỗi",
          response.message || "Không thể đăng ký tài khoản. Vui lòng thử lại sau.",
          [{ text: "Đồng ý" }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể đăng ký tài khoản. Vui lòng thử lại sau.",
        [{ text: "Đồng ý" }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản để truy cập vào hệ thống
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={22} color="#1D3D47" style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={22} color="#1D3D47" style={styles.inputIcon} />
              <TextInput
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#1D3D47" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={22} color="#1D3D47" style={styles.inputIcon} />
              <TextInput
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#1D3D47" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => router.back()}
          >
            <Text style={styles.backToLoginText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3D47',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  button: {
    backgroundColor: '#1D3D47',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLogin: {
    marginTop: 16,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#1D3D47',
    fontSize: 14,
    fontWeight: '500',
  },
}); 