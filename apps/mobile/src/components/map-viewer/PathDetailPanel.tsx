import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Body, Caption } from '../ui/Typography';
import { Button } from '../ui/Button';
import { PATH_COLORS } from './map-constants';
import type { MapPathRecord } from '../../db/powerSyncSchema';

const STROKE_WIDTHS = [1, 2, 4, 6];

export function PathDetailPanel({
  path,
  onUpdate,
  onDelete,
}: {
  path: MapPathRecord;
  onUpdate: (pathId: string, data: { label: string; color: string; strokeWidth: number }) => void;
  onDelete: (pathId: string) => void;
}) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(path.label ?? '');
  const [color, setColor] = useState(path.color ?? '#3B82F6');
  const [strokeWidth, setStrokeWidth] = useState(path.stroke_width ?? 2);

  const handleDelete = () => {
    Alert.alert('Delete Path', 'Are you sure you want to delete this path?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(path.id) },
    ]);
  };

  if (editing) {
    return (
      <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Caption color="secondary" style={styles.fieldLabel}>Label</Caption>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Path label..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />

        <Caption color="secondary" style={styles.fieldLabel}>Color</Caption>
        <View style={styles.colorRow}>
          {PATH_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorSwatch,
                { backgroundColor: c, borderColor: c === color ? '#000' : '#d1d5db' },
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Caption color="secondary" style={styles.fieldLabel}>Thickness</Caption>
        <View style={styles.widthRow}>
          {STROKE_WIDTHS.map((w) => (
            <TouchableOpacity
              key={w}
              style={[
                styles.widthBtn,
                { borderColor: w === strokeWidth ? colors.primary : colors.border },
              ]}
              onPress={() => setStrokeWidth(w)}
            >
              <Caption style={{ color: w === strokeWidth ? colors.primary : colors.text }}>
                {w}px
              </Caption>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionRow}>
          <Button
            variant="primary"
            onPress={() => {
              onUpdate(path.id, { label, color, strokeWidth });
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button variant="outline" onPress={() => setEditing(false)}>
            Cancel
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <View style={[styles.swatch, { backgroundColor: path.color ?? '#3B82F6' }]} />
          <Body style={styles.pathLabel} numberOfLines={1}>
            {path.label || 'Untitled path'}
          </Body>
        </View>
        <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconBtn}>
          <Pencil size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Trash2 size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
      <Caption color="secondary">
        {path.stroke_width ?? 2}px \u00B7 {path.created_at ? new Date(path.created_at).toLocaleDateString() : ''}
      </Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 20,
    height: 12,
    borderRadius: 3,
  },
  pathLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    height: 34,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  widthRow: {
    flexDirection: 'row',
    gap: 8,
  },
  widthBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});
