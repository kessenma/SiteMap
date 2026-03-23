import React, { useState } from 'react';
import { generateUUID } from '../utils/uuid';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { usePowerSyncMutation } from '../hooks/powersync/usePowerSync';

export default function AddFacilityScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { execute } = usePowerSyncMutation();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a facility name.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = generateUUID();
      await execute(
        'INSERT INTO facilities (id, name, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [id, name.trim(), address.trim(), now, now],
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save facility. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.form}>
        <Input
          label="Facility Name"
          placeholder="e.g. Downtown Plant"
          value={name}
          onChangeText={setName}
        />

        <AddressAutocomplete
          label="Address"
          placeholder="Search for an address..."
          value={address}
          onChangeText={setAddress}
          onSelect={({ address: addr }) => setAddress(addr)}
        />

        <Button onPress={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Facility'}
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
});
