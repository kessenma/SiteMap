import { API_CONFIG, AUTH_CONFIG } from '../config';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'auth-service' });

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'technician';
  image?: string | null;
  twoFactorEnabled?: boolean;
}

interface AuthResponse {
  user?: AuthUser;
  session?: { token: string };
  error?: string;
}

interface TwoFactorResponse {
  requiresTwoFactor: true;
  message: string;
}

interface TotpEnableResponse {
  totpURI: string;
  secret: string;
}

function isTwoFactorResponse(data: unknown): data is TwoFactorResponse {
  return typeof data === 'object' && data !== null && 'requiresTwoFactor' in data;
}

class AuthServiceImpl {
  private baseUrl: string;
  private sessionCookie: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.current.BASE_URL;
    this.sessionCookie = storage.getString(AUTH_CONFIG.STORAGE_KEYS.SESSION) ?? null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // better-auth requires Origin header for CSRF protection;
      // React Native fetch doesn't send one by default
      'Origin': 'sitemap-mobile://',
    };
    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }
    return headers;
  }

  private saveCookies(response: Response) {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      // Extract just the name=value pairs from each cookie, stripping attributes
      // like Path, HttpOnly, Secure, SameSite that shouldn't be sent back
      const cookieValues = setCookie
        .split(/,(?=\s*\w+=)/)
        .map((c) => c.split(';')[0].trim())
        .filter(Boolean)
        .join('; ');
      this.sessionCookie = cookieValues;
      storage.set(AUTH_CONFIG.STORAGE_KEYS.SESSION, cookieValues);
    }
  }

  private clearSession() {
    this.sessionCookie = null;
    storage.remove(AUTH_CONFIG.STORAGE_KEYS.SESSION);
    storage.remove(AUTH_CONFIG.STORAGE_KEYS.USER);
    storage.remove(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
    this.clearPowerSyncToken();
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ user: AuthUser } | { requiresTwoFactor: true } | { error: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      this.saveCookies(res);
      const data = await res.json();

      if (!res.ok) {
        return { error: data.message || 'Invalid email or password' };
      }

      if (isTwoFactorResponse(data)) {
        return { requiresTwoFactor: true };
      }

      if (data.user) {
        storage.set(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
        if (data.session?.token) {
          storage.set(AUTH_CONFIG.STORAGE_KEYS.TOKEN, data.session.token);
        }
        return { user: data.user as AuthUser };
      }

      return { error: 'Unexpected response' };
    } catch (e) {
      return { error: 'Network error. Check your connection.' };
    }
  }

  async signUp(
    email: string,
    password: string,
    name: string,
    role: string,
  ): Promise<{ user: AuthUser } | { error: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password, name, role }),
      });

      this.saveCookies(res);
      const data = await res.json();

      if (!res.ok) {
        return { error: data.message || 'Failed to create account' };
      }

      if (data.user) {
        storage.set(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
        if (data.session?.token) {
          storage.set(AUTH_CONFIG.STORAGE_KEYS.TOKEN, data.session.token);
        }
        return { user: data.user as AuthUser };
      }

      return { error: 'Unexpected response' };
    } catch (e) {
      return { error: 'Network error. Check your connection.' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/auth/sign-out`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // Sign out locally even if the server call fails
    }
    this.clearSession();
  }

  async getSession(): Promise<AuthUser | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/get-session`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        // Server reachable but session invalid — return cached user if available
        return this.getCachedUser();
      }

      this.saveCookies(res);
      const data = await res.json();
      if (data?.user) {
        storage.set(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
        return data.user as AuthUser;
      }
      return null;
    } catch {
      // Offline: try to return cached user
      return this.getCachedUser();
    }
  }

  private getCachedUser(): AuthUser | null {
    const cached = storage.getString(AUTH_CONFIG.STORAGE_KEYS.USER);
    return cached ? JSON.parse(cached) : null;
  }

  async enableTotp(): Promise<TotpEnableResponse | { error: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/two-factor/enable`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ type: 'totp' }),
      });

      this.saveCookies(res);
      const data = await res.json();

      if (!res.ok) {
        return { error: data.message || 'Failed to enable 2FA' };
      }
      return data as TotpEnableResponse;
    } catch {
      return { error: 'Network error' };
    }
  }

  async verifyTotp(code: string): Promise<{ success: true } | { error: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/two-factor/verify-totp`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ code }),
      });

      this.saveCookies(res);
      const data = await res.json();

      if (!res.ok) {
        return { error: data.message || 'Invalid code' };
      }

      // After 2FA verification during login, we should have full session
      if (data.user) {
        storage.set(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
      }

      return { success: true };
    } catch {
      return { error: 'Verification failed' };
    }
  }

  /**
   * Fetch a PowerSync-compatible JWT for the current user.
   * Called after login to initialize PowerSync sync.
   */
  async getMobileToken(email: string, password: string): Promise<{ token: string } | { error: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/mobile-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'sitemap-mobile://',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to get token' };
      }

      if (data.token) {
        storage.set('powersync_token', data.token);
        return { token: data.token };
      }
      return { error: 'No token in response' };
    } catch {
      return { error: 'Network error' };
    }
  }

  /**
   * Refresh the PowerSync JWT using the stored token.
   */
  async refreshMobileToken(): Promise<{ token: string } | { error: string }> {
    const currentToken = storage.getString('powersync_token');
    if (!currentToken) return { error: 'No token to refresh' };

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'Origin': 'sitemap-mobile://',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Refresh failed' };
      }

      if (data.token) {
        storage.set('powersync_token', data.token);
        return { token: data.token };
      }
      return { error: 'No token in response' };
    } catch {
      return { error: 'Network error' };
    }
  }

  /**
   * Synchronously read cached user from MMKV (no network).
   * Used to restore auth state instantly on app launch.
   */
  getCachedUserSync(): AuthUser | null {
    return this.getCachedUser();
  }

  /**
   * Get the stored PowerSync token (for PowerSync connector).
   */
  getPowerSyncToken(): string | null {
    return storage.getString('powersync_token') ?? null;
  }

  private clearPowerSyncToken() {
    storage.remove('powersync_token');
  }
}

export const authService = new AuthServiceImpl();
