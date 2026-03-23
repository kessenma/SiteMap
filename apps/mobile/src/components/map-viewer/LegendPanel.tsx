import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Caption, Body } from '../ui/Typography';
import { KeyIconPreview } from './KeyIconPreview';
import type { MapKeyRecord, MapMarkerRecord } from '../../db/powerSyncSchema';

export function LegendPanel({
  keys,
  markers,
}: {
  keys: MapKeyRecord[];
  markers: MapMarkerRecord[];
}) {
  const { colors } = useTheme();

  if (keys.length === 0) {
    return (
      <View style={styles.empty}>
        <Caption color="secondary">No legend keys defined for this map.</Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {keys.map((key) => {
        const count = markers.filter((m) => m.key_id === key.id).length;
        return (
          <View key={key.id} style={[styles.row, { borderColor: colors.border }]}>
            <KeyIconPreview keyDef={{
              icon_type: key.icon_type ?? 'shape',
              icon_shape: key.icon_shape ?? 'circle',
              icon_color: key.icon_color ?? '#3B82F6',
              icon_text: key.icon_text,
              icon_name: key.icon_name ?? '',
              custom_icon_uri: key.custom_icon_uri,
              marker_size: key.marker_size ?? 'md',
            }} size={16} />
            <Body style={styles.label} numberOfLines={1}>
              {key.label}
            </Body>
            <Caption color="secondary" style={styles.count}>
              {count}
            </Caption>
          </View>
        );
      })}
      <Caption color="secondary" style={styles.summary}>
        {markers.length} marker{markers.length !== 1 ? 's' : ''} total
      </Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  empty: {
    padding: 16,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
  count: {
    fontSize: 12,
  },
  summary: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
