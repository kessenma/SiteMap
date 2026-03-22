import { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardContent, Button, FAB, Input, H2, Body, Caption } from '@/components/ui';
import { useHomeViewModel } from '@/viewmodels/useHomeViewModel';

export default function HomeScreen() {
  const { colors } = useTheme();
  const vm = useHomeViewModel();

  const renderProject = useCallback(
    ({ item }: { item: { id: string; name: string; description?: string; address?: string } }) => (
      <Card style={styles.card}>
        <CardHeader>
          <H2 style={styles.cardTitle}>{item.name}</H2>
        </CardHeader>
        <CardContent>
          {item.description ? <Body>{item.description}</Body> : null}
          {item.address ? <Caption>{item.address}</Caption> : null}
        </CardContent>
      </Card>
    ),
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {vm.showNewProject && (
        <View style={[styles.newProjectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input
            placeholder="Site name..."
            value={vm.newName}
            onChangeText={vm.setNewName}
            autoFocus
            onSubmitEditing={vm.createProject}
            containerStyle={styles.inputContainer}
          />
          <Button onPress={vm.createProject} disabled={!vm.canCreate}>
            Create
          </Button>
        </View>
      )}
      <FlatList
        data={vm.projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <H2 style={styles.emptyTitle}>No Sites Yet</H2>
            <Body color="secondary" style={styles.emptySubtitle}>
              Tap + to add your first facility site
            </Body>
          </View>
        }
      />
      <FAB onPress={vm.openNewProject} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 12 },
  cardTitle: { marginBottom: 0 },
  newProjectRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyTitle: { marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { textAlign: 'center' },
});
