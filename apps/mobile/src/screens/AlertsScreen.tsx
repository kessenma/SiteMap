import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { H2, Body } from '../components/ui/Typography';
import { ScreenContainer } from '../components/ui/ScreenContainer';

export default function AlertsScreen() {
  const { colors } = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <H2>Alerts</H2>
        <Body color="secondary">Alerts and notifications will appear here.</Body>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
});
