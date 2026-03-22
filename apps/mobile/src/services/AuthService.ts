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
    };
    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }
    return headers;
  }

  private saveCookies(response: Response) {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.sessionCookie = setCookie;
      storage.set(AUTH_CONFIG.STORAGE_KEYS.SESSION, setCookie);
    }
  }

  private clearSession() {
    this.sessionCookie = null;
    storage.remove(AUTH_CONFIG.STORAGE_KEYS.SESSION);
    storage.remove(AUTH_CONFIG.STORAGE_KEYS.USER);
    storage.remove(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
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

      if (!res.ok) return null;

      this.saveCookies(res);
      const data = await res.json();
      if (data?.user) {
        storage.set(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
        return data.user as AuthUser;
      }
      return null;
    } catch {
      // Offline: try to return cached user
      const cached = storage.getString(AUTH_CONFIG.STORAGE_KEYS.USER);
      return cached ? JSON.parse(cached) : null;
    }
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
}

export const authService = new AuthServiceImpl();
