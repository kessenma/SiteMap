import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Caption } from '../ui/Typography';
import { Button } from '../ui/Button';

export function ListItemCreationCard({
  position,
  listName,
  label,
  onLabelChange,
  description,
  onDescriptionChange,
  onSave,
  onCancel,
}: {
  position: { x: number; y: number };
  listName: string;
  label: string;
  onLabelChange: (text: string) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Caption color="secondary">
        New item for "{listName}" at ({position.x}, {position.y})
      </Caption>
      <TextInput
        value={label}
        onChangeText={onLabelChange}
        placeholder="Label..."
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        autoFocus
      />
      <TextInput
        value={description}
        onChangeText={onDescriptionChange}
        placeholder="Description (optional)"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <View style={styles.actionRow}>
        <Button variant="primary" onPress={onSave}>Add Item</Button>
        <Button variant="outline" onPress={onCancel}>Cancel</Button>
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
  input: {
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
});
