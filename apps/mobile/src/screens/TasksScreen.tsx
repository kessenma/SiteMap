import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { H2, Body } from '../components/ui/Typography';
import { ScreenContainer } from '../components/ui/ScreenContainer';

export default function TasksScreen() {
  const { colors } = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <H2>Tasks</H2>
        <Body color="secondary">Your tasks will appear here.</Body>
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
