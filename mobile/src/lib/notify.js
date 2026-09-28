import { Alert, Platform } from 'react-native';

export function notify(title, message = '') {
  if (Platform.OS === 'web') globalThis.alert?.(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}
