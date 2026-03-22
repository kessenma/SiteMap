import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import { useTheme } from '../contexts/ThemeContext';
import { usePowerSyncQuery, usePowerSyncMutation } from '../hooks/powersync/usePowerSync';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation/MainNavigator';
import type { MapRecord, MapKeyRecord, MapMarkerRecord } from '../db';

type RouteType = RouteProp<RootStackParamList, 'MapViewer'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function MapViewerScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { execute } = usePowerSyncMutation();
  const { mapId } = route.params;

  // Fetch maps for this project
  const { data: maps, refresh: refreshMaps } = usePowerSyncQuery<MapRecord>(
    'SELECT * FROM maps WHERE project_id = ? ORDER BY created_at DESC',
    [mapId],
    [mapId],
  );

  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const currentMap = maps.find((m) => m.id === activeMapId) ?? maps[0] ?? null;

  // Fetch keys and markers for active map
  const effectiveMapId = currentMap?.id ?? '';
  const { data: keys } = usePowerSyncQuery<MapKeyRecord>(
    'SELECT * FROM map_keys WHERE map_id = ? ORDER BY sort_order',
    [effectiveMapId],
    [effectiveMapId],
  );

  const { data: markers, refresh: refreshMarkers } = usePowerSyncQuery<MapMarkerRecord>(
    'SELECT * FROM map_markers WHERE map_id = ?',
    [effectiveMapId],
    [effectiveMapId],
  );

  // Selected key for placing markers
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [isPlacingMode, setIsPlacingMode] = useState(false);

  const uploadMap = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: false,
      });

      if (result.assets?.[0]) {
        const asset = result.assets[0];
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await execute(
          `INSERT INTO maps (id, project_id, name, description, file_type, file_uri, file_name, file_size, width, height, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            mapId,
            asset.fileName ?? 'Untitled Map',
            '',
            'image',
            asset.uri ?? '',
            asset.fileName ?? '',
            asset.fileSize ?? 0,
            asset.width ?? 0,
            asset.height ?? 0,
            user?.id ?? '',
            now,
            now,
          ],
        );
        setActiveMapId(id);
        refreshMaps();
      }
    } catch (err) {
      console.error('Map upload error:', err);
    }
  }, [mapId, user, execute, refreshMaps]);

  const uploadPdf = useCallback(async () => {
    try {
      const [result] = await pick({ type: ['application/pdf'] });
      if (result) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await execute(
          `INSERT INTO maps (id, project_id, name, description, file_type, file_uri, file_name, file_size, width, height, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, mapId, result.name ?? 'Untitled Map', '', 'pdf', result.uri, result.name ?? '', result.size ?? 0, 0, 0, user?.id ?? '', now, now],
        );
        setActiveMapId(id);
        refreshMaps();
      }
    } catch (err) {
      if ((err as any)?.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('PDF upload error:', err);
      }
    }
  }, [mapId, user, execute, refreshMaps]);

  const handleMapPress = useCallback(
    async (event: any) => {
      if (!isPlacingMode || !activeKeyId || !currentMap || !user) return;

      const { locationX, locationY } = event.nativeEvent;
      const { width: viewWidth, height: viewHeight } = Dimensions.get('window');

      // Convert to percentage-based coordinates
      const x = (locationX / viewWidth) * 100;
      const y = (locationY / viewHeight) * 100;

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const key = keys.find((k) => k.id === activeKeyId);

      await execute(
        `INSERT INTO map_markers (id, map_id, key_id, x, y, label, description, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, currentMap.id, activeKeyId, x, y, key?.label ?? '', '', 'active', user.id, now, now],
      );

      refreshMarkers();
    },
    [isPlacingMode, activeKeyId, currentMap, user, keys, execute, refreshMarkers],
  );

  // No maps yet - show upload prompt
  if (!currentMap) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Maps</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Upload a map image or PDF to get started
        </Text>
        <View style={styles.uploadRow}>
          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
            onPress={uploadMap}
          >
            <Text style={styles.uploadBtnText}>Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
            onPress={uploadPdf}
          >
            <Text style={styles.uploadBtnText}>Upload PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.toolBtn, { backgroundColor: colors.primaryLight }]}
          onPress={() => navigation.navigate('KeyEditor', { mapId: currentMap.id })}
        >
          <Text style={[styles.toolBtnText, { color: colors.primary }]}>Legend</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolBtn,
            { backgroundColor: isPlacingMode ? colors.primary : colors.primaryLight },
          ]}
          onPress={() => setIsPlacingMode(!isPlacingMode)}
        >
          <Text
            style={[
              styles.toolBtnText,
              { color: isPlacingMode ? '#fff' : colors.primary },
            ]}
          >
            {isPlacingMode ? 'Done' : 'Place Marker'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, { backgroundColor: colors.primaryLight }]}
          onPress={uploadMap}
        >
          <Text style={[styles.toolBtnText, { color: colors.primary }]}>+ Map</Text>
        </TouchableOpacity>
      </View>

      {/* Key selector (visible when placing) */}
      {isPlacingMode && keys.length > 0 && (
        <ScrollView
          horizontal
          style={[styles.keySelectorBar, { backgroundColor: colors.surface }]}
          contentContainerStyle={styles.keySelectorContent}
          showsHorizontalScrollIndicator={false}
        >
          {keys.map((key) => (
            <TouchableOpacity
              key={key.id}
              style={[
                styles.keyChip,
                {
                  backgroundColor: activeKeyId === key.id ? key.icon_color : colors.background,
                  borderColor: key.icon_color,
                },
              ]}
              onPress={() => setActiveKeyId(key.id)}
            >
              <Text
                style={[
                  styles.keyChipText,
                  { color: activeKeyId === key.id ? '#fff' : colors.text },
                ]}
              >
                {key.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Map image with markers */}
      <ScrollView
        style={styles.mapContainer}
        contentContainerStyle={styles.mapContent}
        maximumZoomScale={5}
        minimumZoomScale={1}
        bouncesZoom
      >
        <TouchableOpacity activeOpacity={1} onPress={handleMapPress}>
          {currentMap.file_type === 'image' && currentMap.file_uri ? (
            <Image
              source={{ uri: currentMap.file_uri }}
              style={styles.mapImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.pdfPlaceholder, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary }}>PDF: {currentMap.file_name}</Text>
            </View>
          )}

          {/* Render markers */}
          {markers.map((marker) => {
            const key = keys.find((k) => k.id === marker.key_id);
            return (
              <TouchableOpacity
                key={marker.id}
                style={[
                  styles.marker,
                  {
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                    backgroundColor: key?.icon_color ?? colors.primary,
                  },
                ]}
                onPress={() =>
                  navigation.navigate('MarkerDetail', {
                    markerId: marker.id,
                    markerLabel: marker.label || key?.label || 'Marker',
                  })
                }
              >
                <View style={styles.markerDot} />
              </TouchableOpacity>
            );
          })}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  toolbar: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  toolBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolBtnText: { fontWeight: '600', fontSize: 14 },
  keySelectorBar: {
    maxHeight: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  keySelectorContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  keyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  keyChipText: { fontSize: 13, fontWeight: '500' },
  mapContainer: { flex: 1 },
  mapContent: { minHeight: '100%' },
  mapImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.4, alignSelf: 'center' },
  pdfPlaceholder: {
    width: SCREEN_WIDTH - 32,
    height: 400,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -14,
    marginTop: -14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, marginBottom: 24 },
  uploadRow: { flexDirection: 'row', gap: 12 },
  uploadBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  uploadBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
