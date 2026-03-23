import React, { useState, useCallback } from 'react';
import { generateUUID } from '../utils/uuid';
import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  MapPin,
  Camera,
  X,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react-native';
import { SERVICE_REQUEST_CATEGORIES } from '@sitemap/shared/schema';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePowerSyncQuery, usePowerSyncMutation } from '../hooks/powersync/usePowerSync';
import { useFileUrl } from '../hooks/useFileUrl';
import { saveFileOfflineFirst } from '../services/FileService';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { H3, Body, Caption } from '../components/ui/Typography';
import type { RootStackParamList } from '../navigation/MainNavigator';
import type { MapRecord } from '../db/powerSyncSchema';

type RouteType = RouteProp<RootStackParamList, 'ITServiceRequest'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function ITServiceRequestScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { execute } = usePowerSyncMutation();
  const { mapId } = route.params;

  const { data: maps } = usePowerSyncQuery<MapRecord>(
    'SELECT * FROM maps WHERE id = ?',
    [mapId],
    [mapId],
  );
  const currentMap = maps[0] ?? null;
  const mapImageUri = useFileUrl(currentMap?.file_uri ?? null);

  // Form state
  const [pinLocation, setPinLocation] = useState<{ x: number; y: number } | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [photos, setPhotos] = useState<{ uri: string; fileName: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleMapPress = useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;
      // Get the actual layout dimensions of the image container
      const target = event.target ?? event.currentTarget;
      target.measure?.(
        (_fx: number, _fy: number, width: number, height: number) => {
          const x = (locationX / width) * 100;
          const y = (locationY / height) * 100;
          setPinLocation({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
        },
      );
      // Fallback if measure isn't available
      if (!target.measure) {
        const { width } = Dimensions.get('window');
        const imgHeight = width * 0.6;
        const x = (locationX / width) * 100;
        const y = (locationY / imgHeight) * 100;
        setPinLocation({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
      }
    },
    [],
  );

  const pickPhoto = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5,
    });
    if (result.assets) {
      setPhotos((prev) => [
        ...prev,
        ...result.assets!.map((a) => ({
          uri: a.uri!,
          fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
        })),
      ]);
    }
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!pinLocation) {
      Alert.alert('Location required', 'Tap the map to mark where the issue is.');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Category required', 'Select or type a request category.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const requestId = generateUUID();
      const now = new Date().toISOString();

      await execute(
        `INSERT INTO service_requests (id, map_id, x, y, category, description, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [requestId, mapId, pinLocation.x, pinLocation.y, category.trim(), description.trim(), 'open', user.id, now, now],
      );

      // Save photos
      for (const photo of photos) {
        const photoId = generateUUID();
        const mimeType = photo.fileName.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';

        const { localPath } = await saveFileOfflineFirst({
          localUri: photo.uri,
          fileName: photo.fileName,
          mimeType,
          folder: 'service-request-photos',
          tableName: 'service_request_photos',
          recordId: photoId,
        });

        await execute(
          `INSERT INTO service_request_photos (id, service_request_id, file_uri, file_name, file_size, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [photoId, requestId, localPath, photo.fileName, 0, now],
        );
      }

      Alert.alert('Request submitted', 'Your IT service request has been created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Service request error:', err);
      Alert.alert('Error', 'Failed to submit service request.');
    } finally {
      setSubmitting(false);
    }
  }, [pinLocation, category, description, photos, user, mapId, execute, navigation]);

  const screenWidth = Dimensions.get('window').width;
  const mapHeight = screenWidth * 0.6;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Map with pin placement */}
        <View style={styles.section}>
          <H3>Tap to mark the location</H3>
          <Pressable onPress={handleMapPress} style={[styles.mapContainer, { height: mapHeight }]}>
            {mapImageUri ? (
              <Image
                source={{ uri: mapImageUri }}
                style={styles.mapImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.mapPlaceholder, { backgroundColor: colors.border }]}>
                <MapPin color={colors.textSecondary} size={32} />
                <Caption color="secondary">Map image unavailable</Caption>
              </View>
            )}
            {pinLocation && (
              <View
                style={[
                  styles.pin,
                  {
                    left: `${pinLocation.x}%`,
                    top: `${pinLocation.y}%`,
                  },
                ]}
              >
                <MapPin color={colors.danger} size={28} fill={colors.danger} />
              </View>
            )}
          </Pressable>
          {pinLocation && (
            <Caption color="secondary" style={{ marginTop: 4 }}>
              Location set — tap again to reposition
            </Caption>
          )}
        </View>

        {/* Category selector */}
        <View style={styles.section}>
          <H3>Request type</H3>
          <TouchableOpacity
            style={[styles.categoryToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setShowCategories((v) => !v)}
            activeOpacity={0.7}
          >
            <Body style={{ flex: 1, color: category ? colors.text : colors.textSecondary }}>
              {category || 'Select or type a category...'}
            </Body>
            {showCategories ? (
              <ChevronUp color={colors.textSecondary} size={18} />
            ) : (
              <ChevronDown color={colors.textSecondary} size={18} />
            )}
          </TouchableOpacity>

          {showCategories && (
            <View style={[styles.categoryList, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {SERVICE_REQUEST_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    { borderBottomColor: colors.border },
                    category === cat && { backgroundColor: colors.primaryLight ?? `${colors.primary}15` },
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategories(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Body style={category === cat ? { color: colors.primary, fontWeight: '600' } : undefined}>
                    {cat}
                  </Body>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Or type a custom category..."
            placeholderTextColor={colors.textSecondary}
            value={category}
            onChangeText={setCategory}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <H3>Description</H3>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text },
            ]}
            placeholder="Describe the issue in more detail..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <H3>Photos</H3>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            <TouchableOpacity
              style={[styles.addPhotoBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={pickPhoto}
              activeOpacity={0.7}
            >
              <Camera color={colors.primary} size={24} />
              <Caption color="secondary">Add photo</Caption>
            </TouchableOpacity>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoThumb}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={[styles.removePhotoBtn, { backgroundColor: colors.danger }]}
                  onPress={() => removePhoto(index)}
                >
                  <X color="#fff" size={14} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Send color="#fff" size={18} />
          <Body style={{ color: '#fff', fontWeight: '600' }}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Body>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  section: {
    marginBottom: 16,
  },
  mapContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pin: {
    position: 'absolute',
    marginLeft: -14,
    marginTop: -28,
  },
  categoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  categoryList: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  categoryOption: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginTop: 8,
  },
  textArea: {
    minHeight: 100,
  },
  photoRow: {
    gap: 10,
    paddingVertical: 4,
  },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
});
