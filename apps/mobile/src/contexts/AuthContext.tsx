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
  /** Returns a PowerSync-compatible JWT. Used by PowerSyncProvider. */
  getPowerSyncToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore cached user synchronously so the app never flashes the login screen
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCachedUserSync());
  const [isLoading, setIsLoading] = useState(!authService.getCachedUserSync());

  // Validate the session against the server in the background
  useEffect(() => {
    let mounted = true;
    authService.getSession().then((sessionUser) => {
      if (mounted) {
        // Update user if server returned fresh data, or clear if session truly expired
        // and there's no cached fallback
        if (sessionUser) {
          setUser(sessionUser);
        }
      }
    }).finally(() => {
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // Store credentials temporarily for PowerSync token fetch after 2FA
  const credentialsRef = React.useRef<{ email: string; password: string } | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    if ('user' in result) {
      setUser(result.user);
      // Fetch PowerSync JWT for sync
      authService.getMobileToken(email, password).catch(console.warn);
      // Register for push notifications after successful login
      pushNotificationService.initialize().catch(console.warn);
      return { success: true as const };
    }
    if ('requiresTwoFactor' in result) {
      // Store credentials so we can fetch PowerSync token after 2FA
      credentialsRef.current = { email, password };
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
      // Fetch PowerSync token using stored credentials
      if (credentialsRef.current) {
        const { email, password } = credentialsRef.current;
        credentialsRef.current = null;
        authService.getMobileToken(email, password).catch(console.warn);
      }
      return { success: true as const };
    }
    return result;
  }, []);

  const getPowerSyncToken = useCallback(async (): Promise<string> => {
    // Try stored token first
    const existing = authService.getPowerSyncToken();
    if (existing) {
      // Try to refresh it (will return existing if still valid)
      const refreshResult = await authService.refreshMobileToken();
      if ('token' in refreshResult) return refreshResult.token;
      // If refresh fails but we have an existing token, use it (might still be valid)
      return existing;
    }
    throw new Error('No PowerSync token available — user must log in');
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
        getPowerSyncToken,
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
