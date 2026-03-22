import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const { colors } = useTheme();

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
    default: { bg: colors.primary, text: '#FFFFFF' },
    secondary: { bg: colors.primaryLight, text: colors.primary },
    outline: { bg: 'transparent', text: colors.text, border: colors.border },
    success: { bg: colors.success, text: '#FFFFFF' },
    danger: { bg: colors.danger, text: '#FFFFFF' },
  };

  const v = variantStyles[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1, borderColor: v.border } : undefined,
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: v.text }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
