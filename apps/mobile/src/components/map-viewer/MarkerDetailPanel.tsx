import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { H3, Body, Caption } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { KeyIconPreview } from './KeyIconPreview';
import type { MapMarkerRecord, MapKeyRecord } from '../../db/powerSyncSchema';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'danger'> = {
  active: 'default',
  resolved: 'success',
  flagged: 'danger',
};

export function MarkerDetailPanel({
  marker,
  keyDef,
  onViewFull,
}: {
  marker: MapMarkerRecord;
  keyDef: MapKeyRecord | undefined;
  onViewFull: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <H3 style={styles.title}>
          {marker.label || 'Untitled marker'}
        </H3>
        <Badge variant={STATUS_VARIANTS[marker.status ?? 'active'] ?? 'default'}>
          {marker.status ?? 'active'}
        </Badge>
      </View>

      {keyDef && (
        <View style={styles.keyRow}>
          <KeyIconPreview keyDef={{
            icon_type: keyDef.icon_type ?? 'shape',
            icon_shape: keyDef.icon_shape ?? 'circle',
            icon_color: keyDef.icon_color ?? '#3B82F6',
            icon_text: keyDef.icon_text,
            icon_name: keyDef.icon_name ?? '',
            custom_icon_uri: keyDef.custom_icon_uri,
            marker_size: keyDef.marker_size ?? 'md',
          }} size={14} />
          <Caption color="secondary">{keyDef.label}</Caption>
        </View>
      )}

      {marker.description ? (
        <Body style={styles.description}>{marker.description}</Body>
      ) : null}

      {marker.updated_at ? (
        <Caption color="secondary">
          Updated {new Date(marker.updated_at).toLocaleDateString()}
        </Caption>
      ) : null}

      <TouchableOpacity
        style={[styles.viewFullBtn, { borderColor: colors.border }]}
        onPress={onViewFull}
        activeOpacity={0.7}
      >
        <Body style={{ flex: 1, fontWeight: '600', fontSize: 14 }}>View Full Details</Body>
        <ChevronRight size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    marginBottom: 0,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  description: {
    fontSize: 14,
  },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
});
