import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { usePowerSyncQuery, usePowerSyncMutation } from '../hooks/powersync/usePowerSync';
import type { RootStackParamList } from '../navigation/MainNavigator';
import type { MapMarkerRecord, MarkerPhotoRecord, MapKeyRecord } from '../db';

type RouteType = RouteProp<RootStackParamList, 'MarkerDetail'>;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#3B82F6' },
  { value: 'flagged', label: 'Flagged', color: '#F59E0B' },
  { value: 'resolved', label: 'Resolved', color: '#22C55E' },
] as const;

export default function MarkerDetailScreen() {
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const { execute } = usePowerSyncMutation();
  const { markerId } = route.params;

  const { data: markerRows, refresh: refreshMarker } = usePowerSyncQuery<MapMarkerRecord>(
    'SELECT * FROM map_markers WHERE id = ?',
    [markerId],
    [markerId],
  );
  const marker = markerRows[0];

  const { data: keyRows } = usePowerSyncQuery<MapKeyRecord>(
    'SELECT * FROM map_keys WHERE id = ?',
    [marker?.key_id ?? ''],
    [marker?.key_id],
  );
  const key = keyRows[0];

  const { data: photos, refresh: refreshPhotos } = usePowerSyncQuery<MarkerPhotoRecord>(
    'SELECT * FROM marker_photos WHERE marker_id = ? ORDER BY created_at DESC',
    [markerId],
    [markerId],
  );

  const [description, setDescription] = useState(marker?.description ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const saveDescription = useCallback(async () => {
    const now = new Date().toISOString();
    await execute('UPDATE map_markers SET description = ?, updated_at = ? WHERE id = ?', [
      description,
      now,
      markerId,
    ]);
    setIsEditing(false);
    refreshMarker();
  }, [description, markerId, execute, refreshMarker]);

  const updateStatus = useCallback(
    async (status: string) => {
      const now = new Date().toISOString();
      await execute('UPDATE map_markers SET status = ?, updated_at = ? WHERE id = ?', [
        status,
        now,
        markerId,
      ]);
      refreshMarker();
    },
    [markerId, execute, refreshMarker],
  );

  const addPhoto = useCallback(
    async (source: 'camera' | 'library') => {
      try {
        const launch = source === 'camera' ? launchCamera : launchImageLibrary;
        const result = await launch({ mediaType: 'photo', quality: 0.8 });

        if (result.assets?.[0]) {
          const asset = result.assets[0];
          const id = crypto.randomUUID();
          const now = new Date().toISOString();

          await execute(
            `INSERT INTO marker_photos (id, marker_id, file_uri, file_name, file_size, caption, taken_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, markerId, asset.uri ?? '', asset.fileName ?? '', asset.fileSize ?? 0, '', now, now],
          );
          refreshPhotos();
        }
      } catch (err) {
        console.error('Photo error:', err);
      }
    },
    [markerId, execute, refreshPhotos],
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      Alert.alert('Delete Photo', 'Remove this photo?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await execute('DELETE FROM marker_photos WHERE id = ?', [photoId]);
            refreshPhotos();
          },
        },
      ]);
    },
    [execute, refreshPhotos],
  );

  if (!marker) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Marker not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Key info */}
      {key && (
        <View style={[styles.keyBadge, { backgroundColor: key.icon_color }]}>
          <Text style={styles.keyBadgeText}>{key.label}</Text>
        </View>
      )}

      {/* Status selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.statusChip,
                {
                  backgroundColor: marker.status === opt.value ? opt.color : colors.surface,
                  borderColor: opt.color,
                },
              ]}
              onPress={() => updateStatus(opt.value)}
            >
              <Text
                style={{
                  color: marker.status === opt.value ? '#fff' : opt.color,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={{ color: colors.primary }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        {isEditing ? (
          <View>
            <TextInput
              style={[styles.descInput, { color: colors.text, borderColor: colors.border }]}
              multiline
              placeholder="Describe this location..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              autoFocus
            />
            <View style={styles.descButtons}>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={saveDescription}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.descText, { color: marker.description ? colors.text : colors.textSecondary }]}>
            {marker.description || 'No description yet. Tap Edit to add one.'}
          </Text>
        )}
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Photos ({photos.length})
          </Text>
          <View style={styles.photoActions}>
            <TouchableOpacity onPress={() => addPhoto('camera')}>
              <Text style={{ color: colors.primary }}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => addPhoto('library')}>
              <Text style={{ color: colors.primary, marginLeft: 16 }}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.photoCard}
                onLongPress={() => deletePhoto(item.id)}
              >
                <Image source={{ uri: item.file_uri }} style={styles.photoImage} />
                {item.caption ? (
                  <Text style={[styles.photoCaption, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.caption}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={[styles.emptyPhotos, { color: colors.textSecondary }]}>
            No photos yet. Use Camera or Gallery to add documentation.
          </Text>
        )}
      </View>

      {/* Coordinates */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Position: ({marker.x.toFixed(1)}%, {marker.y.toFixed(1)}%)
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Created: {new Date(marker.created_at).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  keyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
  },
  keyBadgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  section: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  descInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  descButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  descText: { fontSize: 15, lineHeight: 22 },
  photoActions: { flexDirection: 'row' },
  photoCard: { marginRight: 12, borderRadius: 10, overflow: 'hidden' },
  photoImage: { width: 160, height: 120, borderRadius: 10 },
  photoCaption: { fontSize: 12, padding: 4 },
  emptyPhotos: { fontSize: 14, fontStyle: 'italic' },
});
