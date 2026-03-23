import React, { useState, useCallback, useRef } from 'react';
import { generateUUID } from '../utils/uuid';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import GorhomBottomSheet from '@gorhom/bottom-sheet';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, Building2, Plus, X, UserPlus, Users, Pencil, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SyncStatusSheet } from '../components/SyncStatusSheet';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { H3, Body, Caption } from '../components/ui/Typography';
import { usePowerSyncQuery, usePowerSyncMutation } from '../hooks/powersync/usePowerSync';
import { useFileUrl } from '../hooks/useFileUrl';
import { saveFileOfflineFirst } from '../services/FileService';
import type { UserRecord, FacilityRecord, UserFacilityRecord, TeammateRecord } from '../db/powerSyncSchema';

type TeammateWithUser = TeammateRecord & {
  teammate_name: string | null;
  teammate_email: string | null;
  teammate_image: string | null;
};

type UserFacilityWithDetails = UserFacilityRecord & {
  facility_name: string | null;
  facility_address: string | null;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const syncSheetRef = useRef<GorhomBottomSheet>(null);

  const { data: [profile] = [], refresh: refreshProfile } = usePowerSyncQuery<UserRecord>(
    'SELECT * FROM users WHERE id = ?',
    [user?.id ?? ''],
    [user?.id],
  );

  const { data: userFacilities, refresh: refreshFacilities } = usePowerSyncQuery<UserFacilityWithDetails>(
    `SELECT uf.*, f.name as facility_name, f.address as facility_address
     FROM user_facilities uf
     INNER JOIN facilities f ON uf.facility_id = f.id
     WHERE uf.user_id = ?
     ORDER BY f.name ASC`,
    [user?.id ?? ''],
    [user?.id],
  );

  const { data: allFacilities } = usePowerSyncQuery<FacilityRecord>(
    'SELECT * FROM facilities ORDER BY name ASC',
  );

  const { data: teammates, refresh: refreshTeammates } = usePowerSyncQuery<TeammateWithUser>(
    `SELECT t.*, u.name as teammate_name, u.email as teammate_email, u.image as teammate_image
     FROM teammates t
     LEFT JOIN users u ON t.teammate_id = u.id
     WHERE t.user_id = ?
     ORDER BY u.name ASC`,
    [user?.id ?? ''],
    [user?.id],
  );

  const refreshAll = useCallback(() => {
    refreshProfile();
    refreshFacilities();
    refreshTeammates();
  }, [refreshProfile, refreshFacilities, refreshTeammates]);

  if (!user) return null;

  return (
    <>
      <ScreenContainer scrollable contentStyle={styles.container}>
        <ProfileCard
          profile={profile}
          userId={user.id}
          onUpdated={refreshProfile}
        />

        <FacilitiesSection
          userId={user.id}
          userFacilities={userFacilities}
          allFacilities={allFacilities}
          onChanged={refreshFacilities}
        />

        <TeammatesSection
          userId={user.id}
          teammates={teammates}
          onChanged={refreshAll}
        />

        <View style={styles.signOutContainer}>
          <Button
            variant="outline"
            onPress={() => syncSheetRef.current?.snapToIndex(0)}
            style={{ marginBottom: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RefreshCw color={colors.primary} size={16} />
              <Body style={{ color: colors.primary, fontWeight: '600' }}>Data Sync Status</Body>
            </View>
          </Button>
          <Button variant="outline" onPress={logout}>
            Sign Out
          </Button>
        </View>
      </ScreenContainer>

      <SyncStatusSheet sheetRef={syncSheetRef} />
    </>
  );
}

// --- Profile Card ---

function ProfileCard({
  profile,
  userId,
  onUpdated,
}: {
  profile: UserRecord | undefined;
  userId: string;
  onUpdated: () => void;
}) {
  const { colors } = useTheme();
  const { execute } = usePowerSyncMutation();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const avatarUrl = useFileUrl(profile?.image);

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase()
    || profile?.email?.[0]?.toUpperCase() || '?';

  const handlePhotoUpload = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.fileName) return;

    setUploading(true);
    try {
      const { localPath } = await saveFileOfflineFirst({
        localUri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.type || 'image/jpeg',
        folder: 'avatars',
        tableName: 'users',
        recordId: userId,
        columnName: 'image',
      });

      await execute(
        'UPDATE users SET image = ?, updated_at = ? WHERE id = ?',
        [localPath, new Date().toISOString(), userId],
      );
      onUpdated();
    } catch (err) {
      console.error('Photo upload failed:', err);
      Alert.alert('Error', 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const name = `${firstName} ${lastName}`.trim();
      await execute(
        'UPDATE users SET first_name = ?, last_name = ?, name = ?, updated_at = ? WHERE id = ?',
        [firstName.trim(), lastName.trim(), name, new Date().toISOString(), userId],
      );
      setEditing(false);
      onUpdated();
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <H3>Profile</H3>
          {!editing && (
            <TouchableOpacity
              onPress={() => {
                setFirstName(profile?.first_name ?? '');
                setLastName(profile?.last_name ?? '');
                setEditing(true);
              }}
              hitSlop={8}
            >
              <Pencil color={colors.primary} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </CardHeader>
      <CardContent>
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={handlePhotoUpload} disabled={uploading} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Body style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                  {initials}
                </Body>
              )}
              <View style={styles.cameraOverlay}>
                <Camera color="#fff" size={14} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            {editing ? (
              <View style={styles.editForm}>
                <Input
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                />
                <View style={styles.editButtons}>
                  <Button onPress={handleSave} disabled={saving} style={{ flex: 1 }}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" onPress={() => setEditing(false)} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                </View>
              </View>
            ) : (
              <View>
                <Body style={{ fontWeight: '600', fontSize: 18 }}>
                  {profile?.name || profile?.email || 'Unknown'}
                </Body>
                <Caption color="secondary">{profile?.email}</Caption>
                <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                  <Caption style={{ color: colors.primary, textTransform: 'capitalize' }}>
                    {profile?.role}
                  </Caption>
                </View>
              </View>
            )}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

// --- Facilities Section ---

function FacilitiesSection({
  userId,
  userFacilities,
  allFacilities,
  onChanged,
}: {
  userId: string;
  userFacilities: UserFacilityWithDetails[];
  allFacilities: FacilityRecord[];
  onChanged: () => void;
}) {
  const { colors } = useTheme();
  const { execute } = usePowerSyncMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [adding, setAdding] = useState(false);

  const assignedIds = new Set(userFacilities.map((uf) => uf.facility_id));
  const availableFacilities = allFacilities.filter((f) => !assignedIds.has(f.id));

  const handleAdd = async () => {
    if (!selectedFacilityId) return;
    setAdding(true);
    try {
      const id = generateUUID();
      const now = new Date().toISOString();
      await execute(
        'INSERT INTO user_facilities (id, user_id, facility_id, created_at) VALUES (?, ?, ?, ?)',
        [id, userId, selectedFacilityId, now],
      );
      setShowAdd(false);
      setSelectedFacilityId('');
      onChanged();
    } catch (err) {
      console.error('Failed to add facility:', err);
      Alert.alert('Error', 'Failed to add facility.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (facilityId: string) => {
    Alert.alert('Remove Facility', 'Remove this facility from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await execute(
              'DELETE FROM user_facilities WHERE user_id = ? AND facility_id = ?',
              [userId, facilityId],
            );
            onChanged();
          } catch (err) {
            console.error('Failed to remove facility:', err);
          }
        },
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <View style={styles.titleWithIcon}>
            <Building2 color={colors.text} size={20} />
            <H3 style={{ marginBottom: 0 }}>My Facilities</H3>
          </View>
          <TouchableOpacity onPress={() => setShowAdd(true)} hitSlop={8}>
            <Plus color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </CardHeader>
      <CardContent>
        {userFacilities.length === 0 ? (
          <Body color="secondary" style={{ textAlign: 'center', paddingVertical: 16 }}>
            No facilities assigned yet.
          </Body>
        ) : (
          <View style={{ gap: 8 }}>
            {userFacilities.map((uf) => (
              <View
                key={uf.id}
                style={[styles.listItem, { borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '500', fontSize: 14 }}>{uf.facility_name}</Body>
                  {uf.facility_address ? (
                    <Caption color="secondary">{uf.facility_address}</Caption>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleRemove(uf.facility_id)} hitSlop={8}>
                  <X color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <FacilityPickerModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          facilities={availableFacilities}
          selectedId={selectedFacilityId}
          onSelect={setSelectedFacilityId}
          onConfirm={handleAdd}
          adding={adding}
        />
      </CardContent>
    </Card>
  );
}

function FacilityPickerModal({
  visible,
  onClose,
  facilities,
  selectedId,
  onSelect,
  onConfirm,
  adding,
}: {
  visible: boolean;
  onClose: () => void;
  facilities: FacilityRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  adding: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <H3>Add Facility</H3>
          {facilities.length === 0 ? (
            <Body color="secondary" style={{ textAlign: 'center', paddingVertical: 16 }}>
              All facilities are already assigned.
            </Body>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 250 }}>
                {facilities.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.pickerItem,
                      { borderColor: colors.border },
                      selectedId === f.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => onSelect(f.id)}
                    activeOpacity={0.7}
                  >
                    <Body style={{ fontWeight: '500', fontSize: 14 }}>{f.name}</Body>
                    {f.address ? <Caption color="secondary">{f.address}</Caption> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button onPress={onConfirm} disabled={!selectedId || adding}>
                {adding ? 'Adding...' : 'Add Facility'}
              </Button>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- Teammates Section ---

function TeammatesSection({
  userId,
  teammates,
  onChanged,
}: {
  userId: string;
  teammates: TeammateWithUser[];
  onChanged: () => void;
}) {
  const { colors } = useTheme();
  const { execute } = usePowerSyncMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'team_member' | 'manager'>('team_member');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError('');
    try {
      // Search locally synced users by email
      const db = (await import('../services/powersync/PowerSyncService')).getPowerSyncDatabase();
      const localResults = await db.getAll<{ id: string }>(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email.trim()],
      );

      const targetId = localResults.length > 0 ? localResults[0].id : null;

      if (!targetId) {
        setError('User not found on this device. Try adding them from the web app first.');
        setAdding(false);
        return;
      }

      if (targetId === userId) {
        setError('Cannot add yourself as a teammate.');
        setAdding(false);
        return;
      }

      // Check if already a teammate
      const existing = teammates.find((t) => t.teammate_id === targetId);
      if (existing) {
        setError('Already a teammate.');
        setAdding(false);
        return;
      }

      const id = generateUUID();
      const now = new Date().toISOString();
      await execute(
        'INSERT INTO teammates (id, user_id, teammate_id, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, targetId, role, now, now],
      );

      setShowAdd(false);
      setEmail('');
      setRole('team_member');
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to add teammate.');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (teammateId: string, currentRole: string) => {
    const newRole = currentRole === 'manager' ? 'team_member' : 'manager';
    const label = newRole === 'manager' ? 'Manager' : 'Team Member';
    Alert.alert('Change Role', `Set role to ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await execute(
              'UPDATE teammates SET role = ?, updated_at = ? WHERE user_id = ? AND teammate_id = ?',
              [newRole, new Date().toISOString(), userId, teammateId],
            );
            onChanged();
          } catch (err) {
            console.error('Failed to update role:', err);
          }
        },
      },
    ]);
  };

  const handleRemove = async (teammateId: string) => {
    Alert.alert('Remove Teammate', 'Remove this teammate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await execute(
              'DELETE FROM teammates WHERE user_id = ? AND teammate_id = ?',
              [userId, teammateId],
            );
            onChanged();
          } catch (err) {
            console.error('Failed to remove teammate:', err);
          }
        },
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <View style={styles.titleWithIcon}>
            <Users color={colors.text} size={20} />
            <H3 style={{ marginBottom: 0 }}>Teammates</H3>
          </View>
          <TouchableOpacity onPress={() => setShowAdd(true)} hitSlop={8}>
            <UserPlus color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </CardHeader>
      <CardContent>
        {teammates.length === 0 ? (
          <Body color="secondary" style={{ textAlign: 'center', paddingVertical: 16 }}>
            No teammates added yet.
          </Body>
        ) : (
          <View style={{ gap: 8 }}>
            {teammates.map((t) => (
              <TeammateRow
                key={t.id}
                teammate={t}
                onRoleChange={() => handleRoleChange(t.teammate_id, t.role)}
                onRemove={() => handleRemove(t.teammate_id)}
              />
            ))}
          </View>
        )}

        <AddTeammateModal
          visible={showAdd}
          onClose={() => { setShowAdd(false); setError(''); }}
          email={email}
          onEmailChange={setEmail}
          role={role}
          onRoleChange={setRole}
          onConfirm={handleAdd}
          adding={adding}
          error={error}
        />
      </CardContent>
    </Card>
  );
}

function TeammateRow({
  teammate,
  onRoleChange,
  onRemove,
}: {
  teammate: TeammateWithUser;
  onRoleChange: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const avatarUrl = useFileUrl(teammate.teammate_image);
  const initial = teammate.teammate_name?.[0]?.toUpperCase() || teammate.teammate_email?.[0]?.toUpperCase() || '?';
  const roleLabel = teammate.role === 'manager' ? 'Manager' : 'Team Member';

  return (
    <View style={[styles.listItem, { borderColor: colors.border }]}>
      <View style={[styles.smallAvatar, { backgroundColor: colors.primaryLight }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.smallAvatarImage} />
        ) : (
          <Caption style={{ color: colors.primary, fontWeight: '600' }}>{initial}</Caption>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Body style={{ fontWeight: '500', fontSize: 14 }}>
          {teammate.teammate_name || teammate.teammate_email || 'Unknown'}
        </Body>
        {teammate.teammate_email && teammate.teammate_name ? (
          <Caption color="secondary">{teammate.teammate_email}</Caption>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onRoleChange}
        style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}
      >
        <Caption style={{ color: colors.primary, fontSize: 11 }}>{roleLabel}</Caption>
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} hitSlop={8} style={{ marginLeft: 8 }}>
        <X color={colors.textSecondary} size={16} />
      </TouchableOpacity>
    </View>
  );
}

function AddTeammateModal({
  visible,
  onClose,
  email,
  onEmailChange,
  role,
  onRoleChange,
  onConfirm,
  adding,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (v: string) => void;
  role: 'team_member' | 'manager';
  onRoleChange: (v: 'team_member' | 'manager') => void;
  onConfirm: () => void;
  adding: boolean;
  error: string;
}) {
  const { colors } = useTheme();
  const roleLabel = role === 'manager' ? 'Manager' : 'Team Member';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <H3>Add Teammate</H3>

          <Input
            label="Email address"
            placeholder="colleague@example.com"
            value={email}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View>
            <Caption style={{ fontWeight: '500', color: colors.text, marginBottom: 6 }}>Role</Caption>
            <View style={styles.roleToggle}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { borderColor: colors.border },
                  role === 'team_member' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={() => onRoleChange('team_member')}
              >
                <Caption style={role === 'team_member' ? { color: colors.primary } : { color: colors.textSecondary }}>
                  Team Member
                </Caption>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { borderColor: colors.border },
                  role === 'manager' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={() => onRoleChange('manager')}
              >
                <Caption style={role === 'manager' ? { color: colors.primary } : { color: colors.textSecondary }}>
                  Manager
                </Caption>
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Caption style={{ color: colors.danger }}>{error}</Caption> : null}

          <Button onPress={onConfirm} disabled={!email.trim() || adding}>
            {adding ? 'Adding...' : 'Add Teammate'}
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 40,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  smallAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  editForm: {
    gap: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
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
  pickerItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  roleToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  signOutContainer: {
    marginTop: 8,
  },
});
