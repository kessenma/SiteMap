import React, { useState, useCallback } from 'react';
import { generateUUID } from '../utils/uuid';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { usePowerSyncQuery, usePowerSyncMutation } from '../hooks/powersync/usePowerSync';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation/MainNavigator';
import type { ProjectRecord, MapRecord } from '../db';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { execute } = usePowerSyncMutation();

  const { data: projects, refresh: refreshProjects } = usePowerSyncQuery<ProjectRecord>(
    'SELECT * FROM projects ORDER BY updated_at DESC',
  );

  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');

  const createProject = useCallback(async () => {
    if (!newName.trim() || !user) return;

    const id = generateUUID();
    const now = new Date().toISOString();
    await execute(
      'INSERT INTO projects (id, name, description, address, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, newName.trim(), '', '', user.id, now, now],
    );
    setNewName('');
    setShowNewProject(false);
    refreshProjects();
  }, [newName, user, execute, refreshProjects]);

  const renderProject = useCallback(
    ({ item }: { item: ProjectRecord }) => (
      <ProjectCard
        project={item}
        colors={colors}
        onPress={() => {
          // Navigate to first map or show maps list
          navigation.navigate('MapViewer', {
            mapId: item.id,
            mapName: item.name,
          });
        }}
      />
    ),
    [colors, navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showNewProject && (
        <View style={[styles.newProjectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Site name..."
            placeholderTextColor={colors.textSecondary}
            value={newName}
            onChangeText={setNewName}
            autoFocus
            onSubmitEditing={createProject}
          />
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={createProject}
          >
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Sites Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap + to add your first manufacturing site
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowNewProject(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProjectCard({
  project,
  colors,
  onPress,
}: {
  project: ProjectRecord;
  colors: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.cardTitle, { color: colors.text }]}>{project.name}</Text>
      {project.description ? (
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          {project.description}
        </Text>
      ) : null}
      {project.address ? (
        <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>
          {project.address}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardDesc: { fontSize: 14, marginBottom: 4 },
  cardAddress: { fontSize: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  newProjectRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createBtnText: { color: '#fff', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
