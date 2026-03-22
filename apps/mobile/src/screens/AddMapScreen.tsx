import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { ImagePlus, Building2, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Body, Caption, H3 } from '../components/ui/Typography';
import {
  usePowerSyncMutation,
  usePowerSyncQuery,
} from '../hooks/powersync/usePowerSync';
import type { FacilityRecord } from '../db/powerSyncSchema';

export default function AddMapScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { execute } = usePowerSyncMutation();
  const { data: facilities } = usePowerSyncQuery<FacilityRecord>(
    'SELECT * FROM facilities ORDER BY name ASC',
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<number | null>(null);
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (result.didCancel || !result.assets?.length) return;

    const asset = result.assets[0];
    setImageUri(asset.uri ?? null);
    setImageName(asset.fileName ?? null);
    setImageSize(asset.fileSize ?? null);
    setImageWidth(asset.width ?? null);
    setImageHeight(asset.height ?? null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a map name.');
      return;
    }
    if (!selectedFacilityId) {
      Alert.alert('Required', 'Please select a facility.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Required', 'Please upload a map image.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const mapId = crypto.randomUUID();
      await execute(
        `INSERT INTO maps (id, facility_id, name, description, file_type, file_uri, file_name, file_size, width, height, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'image', ?, ?, ?, ?, ?, ?, ?)`,
        [
          mapId,
          selectedFacilityId,
          name.trim(),
          description.trim(),
          imageUri,
          imageName,
          imageSize,
          imageWidth,
          imageHeight,
          now,
          now,
        ],
      );

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save map. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.form}>
        <Input
          label="Map Name"
          placeholder="e.g. Building A - Floor 1"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Description"
          placeholder="Optional description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        {/* Facility Picker */}
        <View style={styles.section}>
          <H3>Facility</H3>

          <View style={styles.facilityList}>
            {facilities.map((facility) => {
              const isSelected = selectedFacilityId === facility.id;
              return (
                <TouchableOpacity
                  key={facility.id}
                  style={[
                    styles.facilityChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFacilityId(isSelected ? null : facility.id)}
                  activeOpacity={0.7}
                >
                  <Building2
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    size={16}
                  />
                  <View style={styles.facilityChipText}>
                    <Body
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: 14,
                      }}
                    >
                      {facility.name}
                    </Body>
                    {facility.address ? (
                      <Caption
                        style={{
                          color: isSelected ? 'rgba(255,255,255,0.8)' : undefined,
                        }}
                        color={isSelected ? undefined : 'secondary'}
                      >
                        {facility.address}
                      </Caption>
                    ) : null}
                  </View>
                  {isSelected && <Check color="#FFFFFF" size={16} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <H3>Map Image</H3>
          {imageUri ? (
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              <Caption color="secondary" style={styles.tapHint}>
                Tap to change image
              </Caption>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              style={[
                styles.uploadBox,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              activeOpacity={0.7}
            >
              <ImagePlus color={colors.textSecondary} size={32} />
              <Body color="secondary">Tap to upload map image</Body>
            </TouchableOpacity>
          )}
        </View>

        <Button onPress={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Map'}
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  section: {
    gap: 10,
  },
  facilityList: {
    gap: 8,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  facilityChipText: {
    flex: 1,
  },
  uploadBox: {
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  tapHint: {
    textAlign: 'center',
    marginTop: 4,
  },
});
