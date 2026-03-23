import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MousePointer2, MessageCircle, Pencil, ListChecks } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Caption } from '../ui/Typography';
import type { MapMode } from './map-constants';

const MODES: { key: MapMode; icon: typeof MousePointer2; label: string }[] = [
  { key: 'select', icon: MousePointer2, label: 'Select' },
  { key: 'add-comment', icon: MessageCircle, label: 'Comment' },
  { key: 'draw-path', icon: Pencil, label: 'Draw' },
  { key: 'add-list-item', icon: ListChecks, label: 'List Item' },
];

export function MapModeToolbar({
  mode,
  onModeChange,
}: {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {MODES.map(({ key, icon: Icon, label }) => {
        const isActive = mode === key;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.button,
              {
                backgroundColor: isActive ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => onModeChange(isActive ? 'select' : key)}
            activeOpacity={0.7}
          >
            <Icon
              size={18}
              color={isActive ? '#fff' : colors.textSecondary}
            />
            {isActive && (
              <Caption style={styles.label} color="primary">
                {label}
              </Caption>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
});
