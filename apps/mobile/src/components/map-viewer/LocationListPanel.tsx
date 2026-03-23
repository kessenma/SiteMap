import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Body, Caption } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LIST_ITEM_STATUS_COLORS } from './map-constants';
import type { AggregatedList } from '../../hooks/useMapData';

function nextStatus(current: string) {
  if (current === 'pending') return 'in_progress';
  if (current === 'in_progress') return 'completed';
  return 'pending';
}

export function LocationListPanel({
  lists,
  selectedListId,
  selectedItemId,
  onSelectList,
  onSelectItem,
  onCreateList,
  onUpdateItemStatus,
}: {
  lists: AggregatedList[];
  selectedListId: string | null;
  selectedItemId: string | null;
  onSelectList: (listId: string | null) => void;
  onSelectItem: (itemId: string | null) => void;
  onCreateList: (name: string, description: string) => void;
  onUpdateItemStatus: (itemId: string, status: string) => void;
}) {
  const { colors } = useTheme();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateList(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setCreating(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Caption color="secondary" style={styles.headerLabel}>Location Lists</Caption>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreating(!creating)}
        >
          <Plus size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Create form */}
      {creating && (
        <View style={[styles.createForm, { borderColor: colors.border }]}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="List name..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            autoFocus
          />
          <TextInput
            value={newDesc}
            onChangeText={setNewDesc}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
          <View style={styles.createActions}>
            <Button variant="primary" onPress={handleCreate}>Create</Button>
            <Button variant="outline" onPress={() => setCreating(false)}>Cancel</Button>
          </View>
        </View>
      )}

      {/* Lists */}
      {lists.map((list) => {
        const isExpanded = selectedListId === list.id;
        const completed = list.items.filter((i) => (i.status ?? 'pending') === 'completed').length;
        const total = list.items.length;
        const progressPct = total > 0 ? (completed / total) * 100 : 0;

        return (
          <View key={list.id} style={[styles.listCard, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.listHeader}
              onPress={() => onSelectList(isExpanded ? null : list.id)}
              activeOpacity={0.7}
            >
              {isExpanded ? (
                <ChevronDown size={14} color={colors.textSecondary} />
              ) : (
                <ChevronRight size={14} color={colors.textSecondary} />
              )}
              <Body numberOfLines={1} style={styles.listName}>{list.name}</Body>
              <Caption color="secondary">{completed}/{total}</Caption>
            </TouchableOpacity>

            {/* Progress bar */}
            {total > 0 && (
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPct}%` as any,
                      backgroundColor: progressPct === 100 ? '#10B981' : '#3B82F6',
                    },
                  ]}
                />
              </View>
            )}

            {/* Expanded items */}
            {isExpanded && (
              <View style={[styles.itemsContainer, { borderColor: colors.border }]}>
                {list.items.length === 0 ? (
                  <Caption color="secondary" style={styles.emptyItems}>
                    No items yet. Use "List Item" mode to add locations.
                  </Caption>
                ) : (
                  list.items
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((item) => {
                      const isItemSelected = selectedItemId === item.id;
                      const statusColor = LIST_ITEM_STATUS_COLORS[item.status ?? 'pending'] ?? '#9CA3AF';
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemRow,
                            isItemSelected && { backgroundColor: colors.primaryLight },
                          ]}
                          onPress={() => onSelectItem(isItemSelected ? null : item.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.itemBadge, { backgroundColor: statusColor }]}>
                            <Caption style={styles.itemBadgeText}>{item.sort_order ?? 0}</Caption>
                          </View>
                          <Body numberOfLines={1} style={styles.itemLabel}>
                            {item.label || `Item ${item.sort_order ?? 0}`}
                          </Body>
                          <TouchableOpacity
                            onPress={() => onUpdateItemStatus(item.id, nextStatus(item.status ?? 'pending'))}
                            activeOpacity={0.7}
                          >
                            <Badge
                              variant={
                                (item.status ?? 'pending') === 'completed' ? 'success'
                                  : (item.status ?? 'pending') === 'in_progress' ? 'default'
                                    : 'outline'
                              }
                            >
                              {(item.status ?? 'pending').replace('_', ' ')}
                            </Badge>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })
                )}
              </View>
            )}
          </View>
        );
      })}

      {lists.length === 0 && !creating && (
        <Caption color="secondary" style={styles.emptyList}>No location lists yet.</Caption>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addBtn: {
    padding: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  input: {
    height: 34,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  createActions: {
    flexDirection: 'row',
    gap: 6,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  listName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  itemsContainer: {
    borderTopWidth: 1,
    padding: 6,
    gap: 4,
  },
  emptyItems: {
    textAlign: 'center',
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderRadius: 6,
  },
  itemBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  itemLabel: {
    flex: 1,
    fontSize: 13,
  },
  emptyList: {
    paddingVertical: 8,
  },
});
