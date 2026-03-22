import { useState, useCallback, useEffect } from 'react';
import { Passkey } from 'react-native-passkey';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config';

interface AuthenticateResult {
  verified: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function usePasskey() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supported = Passkey.isSupported();
      setIsSupported(supported);
    } catch {
      setIsSupported(false);
    }
  }, []);

  const getBaseUrl = useCallback(() => {
    const baseUrl = API_CONFIG.current.BASE_URL;
    if (Platform.OS === 'android') {
      return baseUrl.replace('localhost', '10.0.2.2');
    }
    return baseUrl;
  }, []);

  const register = useCallback(
    async (email: string, userId?: string): Promise<any> => {
      if (!isSupported) throw new Error('Passkeys are not supported on this device');

      setIsLoading(true);
      setError(null);

      try {
        const baseUrl = getBaseUrl();

        // 1. Get registration options
        const optionsRes = await fetch(`${baseUrl}/api/auth/webauthn/register/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId }),
        });

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json();
          throw new Error(errorData.error || 'Failed to get registration options');
        }

        const optionsData = await optionsRes.json();
        const { challengeToken: regChallengeToken, ...options } = optionsData;

        // 2. Trigger native passkey creation
        let credential;
        try {
          credential = await Passkey.create(options);
        } catch (nativeErr: any) {
          // Retry without excludeCredentials (iCloud Keychain conflict)
          if (options.excludeCredentials?.length > 0) {
            credential = await Passkey.create({ ...options, excludeCredentials: [] });
          } else {
            const msg = nativeErr.message || '';
            if (msg.includes('cancelled') || msg.includes('canceled')) {
              throw new Error('Passkey registration was cancelled');
            }
            throw new Error(msg || 'Passkey creation failed');
          }
        }

        // 3. Verify with server
        const verifyRes = await fetch(`${baseUrl}/api/auth/webauthn/register/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential,
            userId,
            deviceName: `${Platform.OS} Device`,
            challengeToken: regChallengeToken,
          }),
        });

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json();
          throw new Error(errorData.error || 'Failed to verify registration');
        }

        return await verifyRes.json();
      } catch (err: any) {
        const msg = err.message || 'Passkey registration failed';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, getBaseUrl],
  );

  const authenticate = useCallback(
    async (email?: string): Promise<AuthenticateResult> => {
      if (!isSupported) throw new Error('Passkeys are not supported on this device');

      setIsLoading(true);
      setError(null);

      try {
        const baseUrl = getBaseUrl();

        // 1. Get authentication options
        const optionsRes = await fetch(`${baseUrl}/api/auth/webauthn/authenticate/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || undefined }),
        });

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json();
          throw new Error(errorData.error || 'No passkey found for this account');
        }

        const optionsData = await optionsRes.json();
        const { challengeToken, ...options } = optionsData;

        // 2. Trigger native passkey authentication
        const credential = await Passkey.get(options);

        // 3. Verify with server
        const verifyRes = await fetch(`${baseUrl}/api/auth/webauthn/authenticate/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential,
            email: email || undefined,
            challengeToken,
          }),
        });

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json();
          throw new Error(errorData.error || 'Passkey authentication failed');
        }

        return await verifyRes.json();
      } catch (err: any) {
        const msg = err.message || 'Passkey authentication failed';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, getBaseUrl],
  );

  const clearError = useCallback(() => setError(null), []);

  return { isSupported, isLoading, error, register, authenticate, clearError };
}
