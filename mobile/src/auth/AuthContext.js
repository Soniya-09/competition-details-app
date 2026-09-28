import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from '../api';

const STORAGE_KEY = 'feedants.session';

// SecureStore is native-only; fall back to localStorage on web.
const storage = {
  get: () =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(STORAGE_KEY)) : SecureStore.getItemAsync(STORAGE_KEY),
  set: (v) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.setItem(STORAGE_KEY, v)) : SecureStore.setItemAsync(STORAGE_KEY, v),
  clear: () =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(STORAGE_KEY)) : SecureStore.deleteItemAsync(STORAGE_KEY),
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [signInVisible, setSignInVisible] = useState(false);

  useEffect(() => {
    storage
      .get()
      .then((raw) => {
        if (!raw) return;
        const session = JSON.parse(raw);
        setAuthToken(session.token);
        setUser(session.user);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (userId) => {
    const { token, user: nextUser } = await api.demoLogin(userId);
    setAuthToken(token);
    setUser(nextUser);
    setSignInVisible(false);
    await storage.set(JSON.stringify({ token, user: nextUser })).catch(() => {});
    return nextUser;
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await storage.clear().catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      signIn,
      signOut,
      signInVisible,
      requestSignIn: () => setSignInVisible(true),
      dismissSignIn: () => setSignInVisible(false),
    }),
    [user, ready, signIn, signOut, signInVisible],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
