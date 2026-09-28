import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 4000;

function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }
  // hostUri isn't always populated in Expo Go, so fall back to the debugger / linking host
  const hostWithPort =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.linkingUri?.replace(/^\w+:\/\//, '');
  const devHost = hostWithPort?.split(/[:/]/)[0];
  if (devHost) return `http://${devHost}:${API_PORT}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
export const DEFAULT_COMPETITION_SLUG = 'feedants-classical-dance';
