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
import { MapPin, Building2, Plus, Map as MapIcon, Star, ChevronRight, Wrench } from 'lucide-react-native';
import { useFileUrl } from '../hooks/useFileUrl';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { BottomSheet } from '../components/ui/BottomSheet';
import { H2, H3, Body, Caption } from '../components/ui/Typography';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { usePowerSyncQuery } from '../hooks/powersync/usePowerSync';
import type { MapRecord, FacilityRecord } from '../db/powerSyncSchema';
import type { RootStackParamList } from '../navigation/MainNavigator';

type Nav = StackNavigationProp<RootStackParamList>;

type MapWithFacility = MapRecord & {
  facility_name: string | null;
  facility_address: string | null;
  project_name: string | null;
};

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
    `SELECT m.*, f.name as facility_name, f.address as facility_address,
            p.name as project_name
     FROM maps m
     LEFT JOIN facilities f ON m.facility_id = f.id
     LEFT JOIN projects p ON m.project_id = p.id
     ORDER BY m.updated_at DESC`,
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
      <MapThumbnail fileUri={item.file_uri} style={styles.cardImage} placeholderStyle={styles.cardImagePlaceholder} />
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <H2 style={{ flex: 1, marginBottom: 0 }}>{item.name}</H2>
          <ChevronRight color={colors.textSecondary} size={18} />
        </View>
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
        {item.project_name ? (
          <View style={styles.facilityRow}>
            <MapIcon color={colors.textSecondary} size={14} />
            <Caption color="secondary">{item.project_name}</Caption>
          </View>
        ) : null}
        {item.description ? (
          <Caption color="secondary">{item.description}</Caption>
        ) : null}
        {item.updated_at ? (
          <Caption color="secondary" style={{ marginTop: 4 }}>
            Updated {new Date(item.updated_at).toLocaleDateString()}
          </Caption>
        ) : null}
        <TouchableOpacity
          style={[styles.itRequestBtn, { borderColor: colors.border }]}
          onPress={() => {
            navigation.navigate('ITServiceRequest', {
              mapId: item.id,
              mapName: item.name ?? 'Untitled',
            });
          }}
          activeOpacity={0.7}
        >
          <Wrench color={colors.primary} size={14} />
          <Caption style={{ color: colors.primary, fontWeight: '600' }}>IT Request</Caption>
        </TouchableOpacity>
      </CardContent>
    </Card>
  );

  return (
    <ScreenContainer>
      {/* Favorites — TODO: wire up once DB supports it */}
      <View style={styles.section}>
        <H3>Favorites</H3>
        <Card>
          <CardContent style={styles.placeholderContent}>
            <Star color={colors.textSecondary} size={28} style={{ opacity: 0.4 }} />
            <Caption color="secondary">Star maps to quickly access them here.</Caption>
          </CardContent>
        </Card>
      </View>

      {/* Personal maps — TODO: wire up once DB supports it */}
      <View style={styles.section}>
        <H3>My Maps</H3>
        <Card>
          <CardContent style={styles.placeholderContent}>
            <MapIcon color={colors.textSecondary} size={28} style={{ opacity: 0.4 }} />
            <Caption color="secondary">Maps you upload or are assigned to will appear here.</Caption>
          </CardContent>
        </Card>
      </View>

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

      {/* All Maps section header */}
      {maps.length > 0 && (
        <View style={styles.sectionHeader}>
          <H3 style={{ marginBottom: 0 }}>All Maps</H3>
          <Caption color="secondary">
            {maps.length} map{maps.length !== 1 ? 's' : ''}
          </Caption>
        </View>
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
              {hasFacilities ? 'Upload your first map to get started.' : 'Add a facility to get started.'}
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
              <MapThumbnail fileUri={item.file_uri} style={styles.cardImage} placeholderStyle={styles.cardImagePlaceholder} />
              <CardHeader>
                <View style={styles.cardTitleRow}>
                  <H2 style={{ flex: 1, marginBottom: 0 }}>{item.name}</H2>
                  <ChevronRight color={colors.textSecondary} size={18} />
                </View>
              </CardHeader>
              <CardContent>
                {item.description ? (
                  <Caption color="secondary">{item.description}</Caption>
                ) : null}
                {item.updated_at ? (
                  <Caption color="secondary" style={{ marginTop: 4 }}>
                    Updated {new Date(item.updated_at).toLocaleDateString()}
                  </Caption>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </BottomSheet>
    </ScreenContainer>
  );
}

function MapThumbnail({
  fileUri,
  style,
  placeholderStyle,
}: {
  fileUri: string | null;
  style: any;
  placeholderStyle: any;
}) {
  const { colors } = useTheme();
  const resolvedUri = useFileUrl(fileUri);

  if (resolvedUri) {
    return <Image source={{ uri: resolvedUri }} style={style} resizeMode="cover" />;
  }

  return (
    <View style={[placeholderStyle, { backgroundColor: colors.border }]}>
      <MapPin color={colors.textSecondary} size={32} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  itRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
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
