import React, { ReactNode } from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export interface TypographyProps {
  children: ReactNode;
  style?: TextStyle;
  color?: 'primary' | 'secondary' | 'danger' | 'success';
  numberOfLines?: number;
}

export function H1({ children, style, color, numberOfLines }: TypographyProps) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.h1, { color: getColor(colors, color) ?? colors.text }, style]}>
      {children}
    </Text>
  );
}

export function H2({ children, style, color, numberOfLines }: TypographyProps) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.h2, { color: getColor(colors, color) ?? colors.text }, style]}>
      {children}
    </Text>
  );
}

export function H3({ children, style, color, numberOfLines }: TypographyProps) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.h3, { color: getColor(colors, color) ?? colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, color, numberOfLines }: TypographyProps) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, { color: getColor(colors, color) ?? colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Caption({ children, style, color, numberOfLines }: TypographyProps) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.caption, { color: getColor(colors, color) ?? colors.textSecondary }, style]}>
      {children}
    </Text>
  );
}

function getColor(colors: any, color?: string) {
  if (!color) return undefined;
  const map: Record<string, string> = {
    primary: colors.text,
    secondary: colors.textSecondary,
    danger: colors.danger,
    success: colors.success,
  };
  return map[color];
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  h2: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  h3: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 12, lineHeight: 16 },
});
