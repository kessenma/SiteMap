import React, { useState, useEffect } from 'react';
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
import {
  MapPin, Shield, Settings, Wrench,
  Eye, EyeOff, Fingerprint, Check,
  ArrowLeft, ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signupSchema, USER_ROLE_OPTIONS } from '@sitemap/shared/auth';
import type { UserRole } from '@sitemap/shared/schema';
import { authService } from '@/services/AuthService';
import { usePasskey } from '@/hooks/usePasskey';

const ROLE_ICONS = { Shield, Settings, Wrench } as const;

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const { colors } = useTheme();
  const { signup } = useAuth();
  const { isSupported: passkeySupported, register: registerPasskey } = usePasskey();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 0: Role
  const [role, setRole] = useState<UserRole | ''>('');

  // Step 1: Credentials
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: 2FA
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const handleNextFromRole = () => {
    if (!role) {
      setError('Please select a role');
      return;
    }
    setError('');
    setStep(1);
  };

  const handleNextFromCredentials = () => {
    setError('');
    const result = signupSchema.safeParse({ firstName, lastName, email, password, confirmPassword, role });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setStep(2);
  };

  const createAccount = async (): Promise<boolean> => {
    if (accountCreated) return true;
    setIsLoading(true);
    setError('');
    try {
      const res = await signup(email, password, `${firstName} ${lastName}`, role as UserRole);
      if ('error' in res) {
        setError(res.error);
        return false;
      }
      setAccountCreated(true);
      return true;
    } catch {
      setError('Something went wrong');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableTotp = async () => {
    const created = await createAccount();
    if (!created) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await authService.enableTotp();
      if ('error' in res) {
        setError(res.error);
      } else {
        setTotpSecret(res.secret);
      }
    } catch {
      setError('Failed to set up 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (totpCode.length !== 6) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await authService.verifyTotp(totpCode);
      if ('error' in res) {
        setError(res.error);
      } else {
        setTwoFAEnabled(true);
      }
    } catch {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipOrFinish = async () => {
    if (!accountCreated) {
      const created = await createAccount();
      if (!created) return;
    }
    // Auth context already has the user from signup, navigation will update automatically
  };

  // Step indicator
  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            {
              backgroundColor: i === step ? colors.primary : i < step ? colors.primary + '99' : colors.border,
              width: i === step ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  // Step 0: Role Selection
  if (step === 0) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
              <MapPin color={colors.primary} size={32} />
            </View>
            <StepIndicator />
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>What's your role?</Text>

            <View style={styles.form}>
              {USER_ROLE_OPTIONS.map((option) => {
                const Icon = ROLE_ICONS[option.icon as keyof typeof ROLE_ICONS];
                const isSelected = role === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => { setRole(option.value); setError(''); }}
                    style={[
                      styles.roleCard,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary + '08' : colors.surface,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        { backgroundColor: isSelected ? colors.primary : colors.border },
                      ]}
                    >
                      <Icon color={isSelected ? '#fff' : colors.textSecondary} size={18} />
                    </View>
                    <View style={styles.roleText}>
                      <Text style={[styles.roleLabel, { color: colors.text }]}>{option.label}</Text>
                      <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                        {option.description}
                      </Text>
                    </View>
                    {isSelected && <Check color={colors.primary} size={18} />}
                  </TouchableOpacity>
                );
              })}

              {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

              <Button onPress={handleNextFromRole} disabled={!role} style={styles.button}>
                <View style={styles.buttonRow}>
                  <Text style={styles.buttonText}>Next</Text>
                  <ArrowRight color="#fff" size={16} />
                </View>
              </Button>
            </View>

            <View style={styles.footer}>
              <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Step 1: Credentials
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <StepIndicator />
            <Text style={[styles.title, { color: colors.text }]}>Your Details</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your name, email, and password
            </Text>

            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Input
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoComplete="given-name"
                    placeholder="First name"
                    autoFocus
                  />
                </View>
                <View style={styles.nameField}>
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    autoComplete="family-name"
                    placeholder="Last name"
                  />
                </View>
              </View>
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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
                placeholder="Re-enter your password"
              />

              {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

              <View style={styles.buttonGroup}>
                <Button variant="outline" onPress={() => setStep(0)} style={styles.halfButton}>
                  <View style={styles.buttonRow}>
                    <ArrowLeft color={colors.text} size={16} />
                    <Text style={[styles.buttonRowText, { color: colors.text }]}>Back</Text>
                  </View>
                </Button>
                <Button onPress={handleNextFromCredentials} style={styles.halfButton}>
                  <View style={styles.buttonRow}>
                    <Text style={styles.buttonText}>Next</Text>
                    <ArrowRight color="#fff" size={16} />
                  </View>
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Step 2: 2FA Setup
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <StepIndicator />
          <Text style={[styles.title, { color: colors.text }]}>Secure Your Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Set up two-factor authentication
          </Text>

          <View style={styles.form}>
            {/* Passkey option */}
            {passkeySupported && !twoFAEnabled && (
              <TouchableOpacity
                onPress={async () => {
                  const created = await createAccount();
                  if (!created) return;
                  setIsLoading(true);
                  setError('');
                  try {
                    const result = await registerPasskey(email);
                    if (result.verified) {
                      setError(''); // Clear any prior error
                    }
                  } catch (err: any) {
                    if (!err.message?.includes('cancelled')) {
                      setError(err.message || 'Passkey registration failed');
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                style={[styles.roleCard, {
                  borderColor: colors.primary + '50',
                  backgroundColor: colors.primary + '08',
                }]}
                activeOpacity={0.7}
              >
                <View style={[styles.roleIcon, { backgroundColor: colors.primary }]}>
                  <Fingerprint color="#fff" size={20} />
                </View>
                <View style={styles.roleText}>
                  <Text style={[styles.roleLabel, { color: colors.text }]}>Set up Passkey</Text>
                  <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                    Use Face ID or Touch ID for quick sign-in
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* TOTP option */}
            {!totpSecret && !twoFAEnabled && (
              <TouchableOpacity
                onPress={handleEnableTotp}
                disabled={isLoading}
                style={[styles.roleCard, {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }]}
                activeOpacity={0.7}
              >
                <View style={[styles.roleIcon, { backgroundColor: colors.border }]}>
                  <Shield color={colors.textSecondary} size={18} />
                </View>
                <View style={styles.roleText}>
                  <Text style={[styles.roleLabel, { color: colors.text }]}>
                    {isLoading ? 'Setting up...' : 'Use Authenticator App'}
                  </Text>
                  <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                    Use Google Authenticator, Authy, or similar
                  </Text>
                </View>
                {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
              </TouchableOpacity>
            )}

            {/* TOTP setup form */}
            {!!totpSecret && !twoFAEnabled && (
              <View style={[styles.totpSetup, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.roleLabel, { color: colors.text }]}>
                  Set up your authenticator app
                </Text>
                <Text style={[styles.roleDesc, { color: colors.textSecondary, marginBottom: 8 }]}>
                  Add this key to your authenticator app, then enter the code to verify.
                </Text>
                <View style={[styles.secretBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.secretText, { color: colors.text }]} selectable>
                    {totpSecret}
                  </Text>
                </View>
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
                <Button
                  onPress={handleVerifyTotp}
                  disabled={isLoading || totpCode.length !== 6}
                  style={styles.button}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </View>
            )}

            {twoFAEnabled && (
              <View style={[styles.successBanner, { borderColor: '#22c55e30', backgroundColor: '#22c55e10' }]}>
                <Check color="#22c55e" size={18} />
                <Text style={{ color: '#22c55e', fontSize: 14 }}>
                  Two-factor authentication enabled
                </Text>
              </View>
            )}

            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            <View style={styles.buttonGroup}>
              <Button variant="outline" onPress={() => setStep(1)} style={styles.halfButton}>
                <View style={styles.buttonRow}>
                  <ArrowLeft color={colors.text} size={16} />
                  <Text style={[styles.buttonRowText, { color: colors.text }]}>Back</Text>
                </View>
              </Button>
              <Button onPress={handleSkipOrFinish} disabled={isLoading} style={styles.halfButton}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {twoFAEnabled ? 'Finish' : 'Skip for now'}
                  </Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  logoContainer: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row', gap: 6, marginBottom: 16, alignItems: 'center',
  },
  stepDot: { height: 8, borderRadius: 4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  nameRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  form: { width: '100%', gap: 16 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 16,
  },
  roleIcon: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  roleText: { flex: 1 },
  roleLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  roleDesc: { fontSize: 12 },
  eyeButton: { position: 'absolute', right: 12, bottom: 10, padding: 4 },
  button: { width: '100%' },
  buttonGroup: { flexDirection: 'row', gap: 12 },
  halfButton: { flex: 1 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonRowText: { fontSize: 16, fontWeight: '600' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { fontSize: 13, textAlign: 'center' },
  totpSetup: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  secretBox: { borderRadius: 8, padding: 12 },
  secretText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
  totpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  footer: { flexDirection: 'row', marginTop: 24, alignItems: 'center' },
});
