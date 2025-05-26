import { Alert } from 'react-native';
let router: any = null;
export const setRouter = (r: any) => { router = r; };
export const navigateToLogin = () => {
  if (router) {
    const goLogin = () => router.replace('/login');
    Alert.alert(
      'Thông báo',
      'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      [
        { text: 'OK', onPress: goLogin },
      ],
      { cancelable: true, onDismiss: goLogin }
    );
  }
}; 