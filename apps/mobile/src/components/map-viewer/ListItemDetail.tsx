import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ImagePlus } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { Body, Caption } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { useFileUrl } from '../../hooks/useFileUrl';
import { LIST_ITEM_STATUS_COLORS } from './map-constants';
import type { AggregatedListItem } from '../../hooks/useMapData';

const STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export function ListItemDetail({
  item,
  onUpdateStatus,
  onAddPhoto,
}: {
  item: AggregatedListItem;
  onUpdateStatus: (itemId: string, status: string) => void;
  onAddPhoto: (itemId: string, uri: string, fileName: string, fileSize: number) => void;
}) {
  const { colors } = useTheme();
  const statusColor = LIST_ITEM_STATUS_COLORS[item.status ?? 'pending'] ?? '#9CA3AF';

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      onAddPhoto(item.id, asset.uri, asset.fileName ?? 'photo.jpg', asset.fileSize ?? 0);
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Caption style={styles.badgeText}>{item.sort_order ?? 0}</Caption>
        </View>
        <Body style={styles.label} numberOfLines={2}>
          {item.label || `Item ${item.sort_order ?? 0}`}
        </Body>
      </View>

      {/* Status selector */}
      <View style={styles.statusRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.statusChip,
              {
                backgroundColor: (item.status ?? 'pending') === s.key
                  ? LIST_ITEM_STATUS_COLORS[s.key]
                  : 'transparent',
                borderColor: LIST_ITEM_STATUS_COLORS[s.key],
              },
            ]}
            onPress={() => onUpdateStatus(item.id, s.key)}
            activeOpacity={0.7}
          >
            <Caption
              style={{
                color: (item.status ?? 'pending') === s.key ? '#fff' : LIST_ITEM_STATUS_COLORS[s.key],
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {s.label}
            </Caption>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      {item.description ? (
        <Body style={styles.description}>{item.description}</Body>
      ) : null}

      {/* Completion info */}
      {item.completed_at ? (
        <Caption color="secondary">
          Completed {new Date(item.completed_at).toLocaleDateString()}
        </Caption>
      ) : null}

      {/* Photos */}
      {item.photos.length > 0 && (
        <View style={styles.photoGrid}>
          {item.photos.map((photo) => (
            <ListItemPhoto key={photo.id} fileUri={photo.file_uri ?? ''} />
          ))}
        </View>
      )}

      {/* Add photo */}
      <TouchableOpacity
        style={[styles.addPhotoBtn, { borderColor: colors.border }]}
        onPress={handlePickPhoto}
        activeOpacity={0.7}
      >
        <ImagePlus size={14} color={colors.textSecondary} />
        <Caption color="secondary">Add Photo</Caption>
      </TouchableOpacity>
    </View>
  );
}

function ListItemPhoto({ fileUri }: { fileUri: string }) {
  const resolved = useFileUrl(fileUri);
  if (!resolved) return null;
  return (
    <Image source={{ uri: resolved }} style={styles.photo} resizeMode="cover" />
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 28,
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 6,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    minHeight: 32,
  },
});
