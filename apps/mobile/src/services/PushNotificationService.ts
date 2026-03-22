import { Platform } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { createMMKV } from 'react-native-mmkv';
import { API_CONFIG, AUTH_CONFIG } from '../config';

const storage = createMMKV({ id: 'push-notification-service' });
const DEVICE_TOKEN_KEY = '@sitemap:push-token';

class PushNotificationServiceImpl {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.current.BASE_URL;
  }

  private getHeaders(): Record<string, string> {
    const sessionStorage = createMMKV({ id: 'auth-service' });
    const session = sessionStorage.getString(AUTH_CONFIG.STORAGE_KEYS.SESSION);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session) {
      headers['Cookie'] = session;
    }
    return headers;
  }

  /** Request notification permissions and register device token with backend */
  async initialize(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Request permission
      const settings = await notifee.requestPermission();
      if (
        settings.authorizationStatus < AuthorizationStatus.AUTHORIZED
      ) {
        return { success: false, error: 'Notification permission denied' };
      }

      // Get the device token (APNs for iOS, FCM for Android)
      const token = await this.getDeviceToken();
      if (!token) {
        return { success: false, error: 'Failed to get device token' };
      }

      // Register with backend
      await this.sendTokenToBackend(token);
      storage.set(DEVICE_TOKEN_KEY, token);

      return { success: true, token };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Push notification initialization failed:', message);
      return { success: false, error: message };
    }
  }

  /** Get the native push token */
  private async getDeviceToken(): Promise<string | null> {
    try {
      // notifee uses the native APNs token on iOS and FCM token on Android
      const token = await notifee.getAPNSToken();
      return token;
    } catch {
      return null;
    }
  }

  /** Register the device token with the web backend */
  async registerDeviceToken(options?: { force?: boolean }): Promise<string | null> {
    try {
      const existingToken = storage.getString(DEVICE_TOKEN_KEY);
      if (existingToken && !options?.force) {
        // Re-register existing token to update last_seen_at
        await this.sendTokenToBackend(existingToken);
        return existingToken;
      }

      const token = await this.getDeviceToken();
      if (!token) return null;

      await this.sendTokenToBackend(token);
      storage.set(DEVICE_TOKEN_KEY, token);
      return token;
    } catch (error) {
      console.error('Device token registration failed:', error);
      return null;
    }
  }

  /** POST the token to the web API server function */
  private async sendTokenToBackend(token: string): Promise<void> {
    const body = {
      token,
      platform: Platform.OS as 'ios' | 'android',
      environment: __DEV__ ? 'dev' : 'prod',
    };

    const res = await fetch(
      `${this.baseUrl}/api/push-devices/register`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to register device token: ${text}`);
    }
  }

  /** Deactivate the device token on logout */
  async unregisterDeviceToken(): Promise<void> {
    try {
      const token = storage.getString(DEVICE_TOKEN_KEY);
      if (!token) return;

      await fetch(
        `${this.baseUrl}/api/push-devices/deactivate`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ token }),
        },
      );

      storage.remove(DEVICE_TOKEN_KEY);
    } catch (error) {
      console.error('Device token deactivation failed:', error);
    }
  }

  /** Get the currently stored token */
  getStoredToken(): string | null {
    return storage.getString(DEVICE_TOKEN_KEY) ?? null;
  }
}

export const pushNotificationService = new PushNotificationServiceImpl();
