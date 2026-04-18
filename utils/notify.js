import { Alert, Platform, ToastAndroid } from 'react-native';

export const showError = (title, message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(`${title}: ${message}`, ToastAndroid.LONG);
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

export const showSuccess = (title, message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(`${title}: ${message}`, ToastAndroid.SHORT);
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};
