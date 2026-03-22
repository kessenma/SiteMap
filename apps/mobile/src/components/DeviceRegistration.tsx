import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { pushNotificationService } from '../services/PushNotificationService';

export const DeviceRegistration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    token?: string;
    error?: string;
  } | null>(null);

  const handleRegister = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await pushNotificationService.initialize();
      setResult(res);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const storedToken = pushNotificationService.getStoredToken();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notifications</Text>

      {storedToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.label}>Registered Token</Text>
          <Text style={styles.token} numberOfLines={2} ellipsizeMode="middle">
            {storedToken}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {storedToken ? 'Re-register Device' : 'Register for Notifications'}
          </Text>
        )}
      </TouchableOpacity>

      {result && (
        <View
          style={[
            styles.resultContainer,
            result.success ? styles.resultSuccess : styles.resultError,
          ]}
        >
          <Text style={styles.resultText}>
            {result.success
              ? 'Device registered successfully!'
              : `Error: ${result.error}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  tokenContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  token: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 8,
  },
  resultSuccess: {
    backgroundColor: '#dcfce7',
  },
  resultError: {
    backgroundColor: '#fef2f2',
  },
  resultText: {
    fontSize: 14,
  },
});
