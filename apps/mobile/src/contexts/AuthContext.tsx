import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService, type AuthUser } from '../services/AuthService';
import { pushNotificationService } from '../services/PushNotificationService';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<
    { success: true } | { requiresTwoFactor: true } | { error: string }
  >;
  signup: (email: string, password: string, name: string, role: string) => Promise<
    { success: true } | { error: string }
  >;
  verifyTotp: (code: string) => Promise<{ success: true } | { error: string }>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;
    authService.getSession().then((sessionUser) => {
      if (mounted && sessionUser) {
        setUser(sessionUser);
      }
    }).finally(() => {
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    if ('user' in result) {
      setUser(result.user);
      // Register for push notifications after successful login
      pushNotificationService.initialize().catch(console.warn);
      return { success: true as const };
    }
    if ('requiresTwoFactor' in result) {
      return { requiresTwoFactor: true as const };
    }
    return result;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: string) => {
    const result = await authService.signUp(email, password, name, role);
    if ('user' in result) {
      setUser(result.user);
      return { success: true as const };
    }
    return result;
  }, []);

  const verifyTotp = useCallback(async (code: string) => {
    const result = await authService.verifyTotp(code);
    if ('success' in result) {
      // Refresh session after 2FA verification
      const sessionUser = await authService.getSession();
      if (sessionUser) setUser(sessionUser);
      return { success: true as const };
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await pushNotificationService.unregisterDeviceToken().catch(console.warn);
    await authService.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        verifyTotp,
        logout,
        setUser,
      }}
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
