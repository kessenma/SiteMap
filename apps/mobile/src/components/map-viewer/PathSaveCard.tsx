import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Caption } from '../ui/Typography';
import { Button } from '../ui/Button';
import { PATH_COLORS } from './map-constants';

export function PathSaveCard({
  pointCount,
  label,
  onLabelChange,
  color,
  onColorChange,
  onSave,
  onDiscard,
}: {
  pointCount: number;
  label: string;
  onLabelChange: (text: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Caption color="secondary">
        Save drawn path ({pointCount} points)
      </Caption>
      <View style={styles.colorRow}>
        {PATH_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c, borderColor: c === color ? '#000' : '#d1d5db' },
            ]}
            onPress={() => onColorChange(c)}
          />
        ))}
      </View>
      <View style={styles.row}>
        <TextInput
          value={label}
          onChangeText={onLabelChange}
          placeholder="Label (optional)"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          autoFocus
        />
        <Button variant="primary" onPress={onSave}>
          Save
        </Button>
        <Button variant="outline" onPress={onDiscard}>
          Discard
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 14,
  },
});
