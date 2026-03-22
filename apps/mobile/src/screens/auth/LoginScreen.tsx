import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Eye, EyeOff, Fingerprint } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginSchema } from '@sitemap/shared/auth';
import { usePasskey } from '@/hooks/usePasskey';

interface LoginScreenProps {
  onNavigateToSignup: () => void;
}

export default function LoginScreen({ onNavigateToSignup }: LoginScreenProps) {
  const { colors } = useTheme();
  const { login, verifyTotp } = useAuth();
  const { isSupported: passkeySupported, authenticate: passkeyAuthenticate } = usePasskey();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if ('requiresTwoFactor' in res) {
        setNeeds2FA(true);
      } else if ('error' in res) {
        setError(res.error);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (totpCode.length !== 6) return;
    setError('');
    setTwoFALoading(true);
    try {
      const res = await verifyTotp(totpCode);
      if ('error' in res) {
        setError(res.error);
      }
    } catch {
      setError('Verification failed');
    } finally {
      setTwoFALoading(false);
    }
  };

  if (needs2FA) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Two-Factor Authentication</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-digit code from your authenticator app
          </Text>

          <Input
            label="Verification Code"
            value={totpCode}
            onChangeText={(text) => setTotpCode(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            style={styles.totpInput}
            autoFocus
          />

          {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

          <Button
            onPress={handleVerify2FA}
            disabled={twoFALoading || totpCode.length !== 6}
            style={styles.button}
          >
            {twoFALoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              'Verify'
            )}
          </Button>

          <Button
            variant="ghost"
            onPress={() => {
              setNeeds2FA(false);
              setTotpCode('');
              setError('');
            }}
            style={styles.button}
          >
            Back to login
          </Button>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
            <MapPin color={colors.primary} size={32} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>SiteMap</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to your account
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@company.com"
            />

            <View>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff color={colors.textSecondary} size={20} />
                ) : (
                  <Eye color={colors.textSecondary} size={20} />
                )}
              </TouchableOpacity>
            </View>

            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            <Button onPress={handleLogin} disabled={isLoading} style={styles.button}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                'Sign In'
              )}
            </Button>

            {passkeySupported && (
              <Button
                variant="outline"
                onPress={async () => {
                  setError('');
                  setIsLoading(true);
                  try {
                    const result = await passkeyAuthenticate(email || undefined);
                    if (result.verified) {
                      // TODO: Exchange passkey token for better-auth session
                    }
                  } catch (err: any) {
                    setError(err.message || 'Passkey authentication failed');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                style={styles.button}
              >
                <View style={styles.buttonRow}>
                  <Fingerprint color={colors.text} size={18} />
                  <Text style={[styles.buttonRowText, { color: colors.text }]}>
                    Sign in with Passkey
                  </Text>
                </View>
              </Button>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignup}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
  },
  form: {
    width: '100%',
    gap: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    padding: 4,
  },
  button: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonRowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 13,
    textAlign: 'center',
  },
  totpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
});
