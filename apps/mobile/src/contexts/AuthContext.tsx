import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { MMKV } from 'react-native-mmkv';
import { AUTH_CONFIG } from '../config';

let _storage: MMKV | null = null;
function getStorage(): MMKV {
  if (!_storage) {
    _storage = new MMKV();
  }
  return _storage;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'inspector' | 'viewer';
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStorage().getString(AUTH_CONFIG.STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return getStorage().getString(AUTH_CONFIG.STORAGE_KEYS.TOKEN) ?? null;
  });

  const login = useCallback((newUser: User, newToken: string) => {
    getStorage().set(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(newUser));
    getStorage().set(AUTH_CONFIG.STORAGE_KEYS.TOKEN, newToken);
    setUser(newUser);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    getStorage().delete(AUTH_CONFIG.STORAGE_KEYS.USER);
    getStorage().delete(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
    setUser(null);
    setToken(null);
  }, []);

  const getToken = useCallback(async (): Promise<string> => {
    const t = getStorage().getString(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
    if (!t) throw new Error('No auth token available');
    return t;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user && !!token, login, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
