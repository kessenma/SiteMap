import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Caption } from '../ui/Typography';
import { Button } from '../ui/Button';

export function CommentCreationCard({
  position,
  text,
  onTextChange,
  onSave,
  onCancel,
}: {
  position: { x: number; y: number };
  text: string;
  onTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Caption color="secondary">
        New comment at ({position.x}, {position.y})
      </Caption>
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={onTextChange}
          placeholder="Write a comment..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          autoFocus
          returnKeyType="send"
          onSubmitEditing={onSave}
        />
        <Button variant="primary" onPress={onSave}>
          Post
        </Button>
        <Button variant="outline" onPress={onCancel}>
          Cancel
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
