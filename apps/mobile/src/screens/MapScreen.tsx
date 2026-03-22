import React, { useState } from 'react';
import {
  View,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MapPin, Building2 } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { H2, Body, Caption } from '../components/ui/Typography';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { usePowerSyncQuery } from '../hooks/powersync/usePowerSync';
import type { MapRecord, FacilityRecord } from '../db/powerSyncSchema';
import type { RootStackParamList } from '../navigation/MainNavigator';

type Nav = StackNavigationProp<RootStackParamList>;

type MapWithFacility = MapRecord & { facility_name: string | null; facility_address: string | null };

export default function MapScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const { data: facilities } = usePowerSyncQuery<FacilityRecord>(
    'SELECT * FROM facilities ORDER BY name ASC',
  );

  const { data: maps, isLoading } = usePowerSyncQuery<MapWithFacility>(
    selectedFacilityId
      ? `SELECT m.*, f.name as facility_name, f.address as facility_address
         FROM maps m LEFT JOIN facilities f ON m.facility_id = f.id
         WHERE m.facility_id = ?
         ORDER BY m.created_at DESC`
      : `SELECT m.*, f.name as facility_name, f.address as facility_address
         FROM maps m LEFT JOIN facilities f ON m.facility_id = f.id
         ORDER BY m.created_at DESC`,
    selectedFacilityId ? [selectedFacilityId] : [],
    [selectedFacilityId],
  );

  const renderMap = ({ item }: { item: MapWithFacility }) => (
    <Card
      onPress={() =>
        navigation.navigate('MapViewer', {
          mapId: item.id,
          mapName: item.name ?? 'Untitled',
        })
      }
    >
      {item.file_uri ? (
        <Image source={{ uri: item.file_uri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.border }]}>
          <MapPin color={colors.textSecondary} size={32} />
        </View>
      )}
      <CardHeader>
        <H2>{item.name}</H2>
      </CardHeader>
      <CardContent>
        {item.facility_name ? (
          <View style={styles.facilityRow}>
            <Building2 color={colors.textSecondary} size={14} />
            <Caption color="secondary">
              {item.facility_name}
              {item.facility_address ? ` · ${item.facility_address}` : ''}
            </Caption>
          </View>
        ) : null}
        {item.description ? (
          <Caption color="secondary">{item.description}</Caption>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <ScreenContainer>
      {facilities.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedFacilityId === null ? colors.primary : colors.surface,
                borderColor: selectedFacilityId === null ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedFacilityId(null)}
          >
            <Body
              style={{
                color: selectedFacilityId === null ? '#FFFFFF' : colors.text,
                fontSize: 14,
              }}
            >
              All
            </Body>
          </TouchableOpacity>
          {facilities.map((facility) => {
            const isSelected = selectedFacilityId === facility.id;
            return (
              <TouchableOpacity
                key={facility.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedFacilityId(isSelected ? null : facility.id)}
              >
                <Body
                  style={{
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontSize: 14,
                  }}
                >
                  {facility.name}
                </Body>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <FlatList
        data={maps}
        keyExtractor={(item) => item.id}
        renderItem={renderMap}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MapPin color={colors.textSecondary} size={48} />
            <Body color="secondary">Upload your first map</Body>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  list: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
});
