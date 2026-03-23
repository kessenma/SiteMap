import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Body, Caption } from '../ui/Typography';
import type { MapPathRecord } from '../../db/powerSyncSchema';

export function PathList({
  paths,
  selectedPathId,
  onSelect,
}: {
  paths: MapPathRecord[];
  selectedPathId: string | null;
  onSelect: (pathId: string) => void;
}) {
  const { colors } = useTheme();

  if (paths.length === 0) {
    return (
      <View style={styles.empty}>
        <Caption color="secondary">
          No paths yet. Use "Draw" mode to draw on the map.
        </Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {paths.map((p) => {
        const isSelected = selectedPathId === p.id;
        return (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.row,
              {
                borderColor: colors.border,
                backgroundColor: isSelected ? colors.primaryLight : 'transparent',
              },
            ]}
            onPress={() => onSelect(p.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.swatch, { backgroundColor: p.color ?? '#3B82F6' }]} />
            <Body numberOfLines={1} style={styles.label}>
              {p.label || 'Untitled path'}
            </Body>
            {isSelected && (
              <Caption color="secondary" style={styles.hint}>tap to edit</Caption>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  empty: {
    padding: 16,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  swatch: {
    width: 20,
    height: 12,
    borderRadius: 3,
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
  hint: {
    fontSize: 10,
  },
});
