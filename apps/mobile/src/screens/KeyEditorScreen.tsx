import React, { useState, useCallback } from 'react';
import { generateUUID } from '../utils/uuid';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { usePowerSyncQuery, usePowerSyncMutation } from '../hooks/powersync/usePowerSync';
import type { RootStackParamList } from '../navigation/MainNavigator';
import type { MapKeyRecord } from '../db';
import type { IconShape } from '@sitemap/shared/types';

type RouteType = RouteProp<RootStackParamList, 'KeyEditor'>;

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

const SHAPES: { value: IconShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'diamond', label: 'Diamond' },
];

export default function KeyEditorScreen() {
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const { execute } = usePowerSyncMutation();
  const { mapId } = route.params;

  const { data: keys, refresh } = usePowerSyncQuery<MapKeyRecord>(
    'SELECT * FROM map_keys WHERE map_id = ? ORDER BY sort_order',
    [mapId],
    [mapId],
  );

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedShape, setSelectedShape] = useState<IconShape>('circle');

  const addKey = useCallback(async () => {
    if (!label.trim()) return;

    const id = generateUUID();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO map_keys (id, map_id, label, icon_name, icon_color, icon_shape, custom_icon_uri, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, mapId, label.trim(), '', selectedColor, selectedShape, null, keys.length, now, now],
    );

    setLabel('');
    setShowForm(false);
    refresh();
  }, [label, selectedColor, selectedShape, mapId, keys.length, execute, refresh]);

  const deleteKey = useCallback(
    async (keyId: string) => {
      Alert.alert('Delete Key', 'This will also remove all markers using this key.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await execute('DELETE FROM map_markers WHERE key_id = ?', [keyId]);
            await execute('DELETE FROM map_keys WHERE id = ?', [keyId]);
            refresh();
          },
        },
      ]);
    },
    [execute, refresh],
  );

  const renderKey = ({ item }: { item: MapKeyRecord }) => (
    <View style={[styles.keyRow, { borderColor: colors.border }]}>
      <View style={[styles.keyIcon, { backgroundColor: item.icon_color }]}>
        <ShapePreview shape={item.icon_shape as IconShape} />
      </View>
      <Text style={[styles.keyLabel, { color: colors.text }]}>{item.label}</Text>
      <TouchableOpacity onPress={() => deleteKey(item.id)}>
        <Text style={{ color: colors.danger, fontSize: 14 }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={keys}
        keyExtractor={(item) => item.id}
        renderItem={renderKey}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No legend keys yet. Add items to create your map legend.
            </Text>
          </View>
        }
      />

      {showForm && (
        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Key label (e.g. Fire Extinguisher)"
            placeholderTextColor={colors.textSecondary}
            value={label}
            onChangeText={setLabel}
            autoFocus
          />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSwatchSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Shape</Text>
          <View style={styles.shapeRow}>
            {SHAPES.map((shape) => (
              <TouchableOpacity
                key={shape.value}
                style={[
                  styles.shapeBtn,
                  {
                    backgroundColor:
                      selectedShape === shape.value ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedShape(shape.value)}
              >
                <Text
                  style={{
                    color: selectedShape === shape.value ? '#fff' : colors.text,
                    fontSize: 13,
                  }}
                >
                  {shape.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={addKey}
            >
              <Text style={styles.addBtnText}>Add Key</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showForm && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ShapePreview({ shape }: { shape: IconShape }) {
  const size = 14;
  switch (shape) {
    case 'square':
      return <View style={{ width: size, height: size, backgroundColor: '#fff' }} />;
    case 'triangle':
      return (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size / 2,
            borderRightWidth: size / 2,
            borderBottomWidth: size,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#fff',
          }}
        />
      );
    case 'diamond':
      return (
        <View
          style={{
            width: size,
            height: size,
            backgroundColor: '#fff',
            transform: [{ rotate: '45deg' }],
          }}
        />
      );
    default:
      return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff' }} />
      );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  keyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { flex: 1, fontSize: 16 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8, textTransform: 'uppercase' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  shapeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  shapeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  formButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
