import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type GorhomBottomSheet from '@gorhom/bottom-sheet';
import { MapPin, Building2, Plus, Map as MapIcon } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { BottomSheet } from '../components/ui/BottomSheet';
import { H2, H3, Body, Caption } from '../components/ui/Typography';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { usePowerSyncQuery } from '../hooks/powersync/usePowerSync';
import type { MapRecord, FacilityRecord } from '../db/powerSyncSchema';
import type { RootStackParamList } from '../navigation/MainNavigator';

type Nav = StackNavigationProp<RootStackParamList>;

type MapWithFacility = MapRecord & { facility_name: string | null; facility_address: string | null };

export default function MapScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityRecord | null>(null);
  const sheetRef = useRef<GorhomBottomSheet>(null);

  const { data: facilities } = usePowerSyncQuery<FacilityRecord>(
    'SELECT * FROM facilities ORDER BY name ASC',
  );

  const hasFacilities = facilities.length > 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{ marginRight: 16 }}
        >
          <Plus color={colors.primary} size={24} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.primary]);

  const { data: maps } = usePowerSyncQuery<MapWithFacility>(
    `SELECT m.*, f.name as facility_name, f.address as facility_address
     FROM maps m LEFT JOIN facilities f ON m.facility_id = f.id
     ORDER BY m.created_at DESC`,
  );

  const facilityMaps = selectedFacility
    ? maps.filter((m) => m.facility_id === selectedFacility.id)
    : [];

  const openFacilitySheet = useCallback((facility: FacilityRecord) => {
    setSelectedFacility(facility);
    sheetRef.current?.snapToIndex(0);
  }, []);

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
          {facilities.map((facility) => {
            const count = maps.filter((m) => m.facility_id === facility.id).length;
            return (
              <TouchableOpacity
                key={facility.id}
                style={[
                  styles.facilityCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => openFacilitySheet(facility)}
                activeOpacity={0.7}
              >
                <View style={styles.facilityCardHeader}>
                  <Building2
                    color={colors.textSecondary}
                    size={16}
                  />
                  <Body
                    style={{ fontWeight: '600', fontSize: 14, flex: 1 }}
                    numberOfLines={1}
                  >
                    {facility.name}
                  </Body>
                </View>
                {facility.address ? (
                  <Caption color="secondary" numberOfLines={1}>
                    {facility.address}
                  </Caption>
                ) : null}
                <Caption color="secondary" style={{ marginTop: 2 }}>
                  {count} map{count !== 1 ? 's' : ''}
                </Caption>
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
            <Body color="secondary">
              {hasFacilities ? 'Upload your first map' : 'Add a facility to get started'}
            </Body>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <H3>What would you like to add?</H3>

            <TouchableOpacity
              style={[styles.modalOption, { borderColor: colors.border }]}
              onPress={() => {
                setShowAddModal(false);
                navigation.getParent()?.navigate('AddFacility');
              }}
              activeOpacity={0.7}
            >
              <Building2 color={colors.primary} size={24} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '600' }}>Facility</Body>
                <Caption color="secondary">A building, plant, or site</Caption>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalOption,
                { borderColor: colors.border },
                !hasFacilities && { opacity: 0.4 },
              ]}
              onPress={() => {
                if (!hasFacilities) return;
                setShowAddModal(false);
                navigation.getParent()?.navigate('AddMap');
              }}
              activeOpacity={hasFacilities ? 0.7 : 1}
            >
              <MapIcon color={hasFacilities ? colors.primary : colors.textSecondary} size={24} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '600', color: hasFacilities ? colors.text : colors.textSecondary }}>
                  Map
                </Body>
                <Caption color="secondary">
                  {hasFacilities
                    ? 'A floor plan or site map'
                    : 'Add a facility first'}
                </Caption>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <BottomSheet
        sheetRef={sheetRef}
        title={selectedFacility?.name ?? 'Maps'}
        onClose={() => setSelectedFacility(null)}
      >
        {selectedFacility?.address ? (
          <Caption color="secondary" style={{ marginBottom: 4 }}>
            {selectedFacility.address}
          </Caption>
        ) : null}
        {facilityMaps.length === 0 ? (
          <View style={styles.empty}>
            <MapPin color={colors.textSecondary} size={32} />
            <Body color="secondary">No maps for this facility</Body>
          </View>
        ) : (
          facilityMaps.map((item) => (
            <Card
              key={item.id}
              onPress={() => {
                sheetRef.current?.close();
                navigation.navigate('MapViewer', {
                  mapId: item.id,
                  mapName: item.name ?? 'Untitled',
                });
              }}
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
              {item.description ? (
                <CardContent>
                  <Caption color="secondary">{item.description}</Caption>
                </CardContent>
              ) : null}
            </Card>
          ))
        )}
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  facilityCard: {
    minWidth: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  facilityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
