// Bottom sheet showing PowerSync data sync status and local data counts.
// Users can compare counts with colleagues to verify they have the same data.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  RefreshCw,
  Trash2,
  Users,
  MapPin,
  Map,
  Building2,
  Image,
  MessageCircle,
  Route,
  List,
  Key,
  Wrench,
} from 'lucide-react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { usePowerSync } from '../hooks/powersync/usePowerSync';
import { H3, Body, Caption } from './ui/Typography';
import { getPowerSyncDatabase } from '../services/powersync/PowerSyncService';

interface SyncStatusSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheet | null>;
}

interface TableDisplayInfo {
  table: string;
  label: string;
  icon: React.ReactNode;
}

function getRelativeTime(date: Date | undefined): string {
  if (!date) return 'Never';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function SyncStatusSheet({ sheetRef }: SyncStatusSheetProps) {
  const { colors } = useTheme();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const {
    isConnected,
    isConnecting,
    isReady,
    hasSynced,
    lastSyncedAt,
    reconnect,
    resetLocalDatabase,
    getPendingChangesCount,
  } = usePowerSync();

  // Status display
  let statusColor: string = colors.textSecondary;
  let statusText = 'Offline';
  if (isConnected) {
    statusColor = colors.success;
    statusText = hasSynced ? 'Connected' : 'Connected — syncing...';
  } else if (isConnecting) {
    statusColor = colors.warning;
    statusText = 'Connecting...';
  }

  // Reconnect
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectError, setReconnectError] = useState<string | null>(null);

  const handleReconnect = async () => {
    if (isReconnecting) return;
    setIsReconnecting(true);
    setReconnectError(null);
    try {
      await reconnect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reconnect failed';
      setReconnectError(message);
      console.error('Reconnect failed:', err);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Pending changes count
  const [pendingCount, setPendingCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen || !isReady) return;
    const fetchPendingCount = async () => {
      const count = await getPendingChangesCount();
      setPendingCount(count);
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);
    return () => clearInterval(interval);
  }, [sheetOpen, isReady, getPendingChangesCount]);

  // Data counts — re-fetch when sheet opens, when hasSynced flips, or when lastSyncedAt changes
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isCountsLoading, setIsCountsLoading] = useState(true);

  useEffect(() => {
    if (!sheetOpen || !isReady) return;
    const fetchCounts = async () => {
      setIsCountsLoading(true);
      try {
        const db = getPowerSyncDatabase();
        const tableNames = [
          'users', 'facilities', 'projects', 'maps', 'map_keys',
          'map_markers', 'marker_photos', 'map_comments', 'map_paths',
          'map_lists', 'service_requests',
        ];
        const results: Record<string, number> = {};
        for (const t of tableNames) {
          try {
            const r = await db.getAll<{ count: number }>(
              `SELECT count(*) as count FROM ${t}`,
            );
            results[t] = r[0]?.count ?? 0;
          } catch {
            results[t] = 0;
          }
        }
        setCounts(results);
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      } finally {
        setIsCountsLoading(false);
      }
    };
    fetchCounts();
    // Also poll periodically while sheet is open, so counts update as sync progresses
    const interval = setInterval(fetchCounts, 4000);
    return () => clearInterval(interval);
  }, [sheetOpen, isReady, hasSynced]);

  // Reset local data
  const [resetCooldown, setResetCooldown] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resetCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResetCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      };
    }
  }, [resetCooldown > 0]);

  const handleResetLocalData = () => {
    Alert.alert(
      'Reset Local Data',
      'This will delete all local data and re-download everything from the server. This may take a moment depending on your connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await resetLocalDatabase();
            } catch (err) {
              console.error('Reset failed:', err);
            } finally {
              setIsResetting(false);
              setResetCooldown(60);
            }
          },
        },
      ],
    );
  };

  const iconColor = colors.textSecondary;
  const iconSize = 18;

  const tables: TableDisplayInfo[] = [
    { table: 'users', label: 'Users', icon: <Users size={iconSize} color={iconColor} /> },
    { table: 'facilities', label: 'Facilities', icon: <Building2 size={iconSize} color={iconColor} /> },
    { table: 'projects', label: 'Projects', icon: <Map size={iconSize} color={iconColor} /> },
    { table: 'maps', label: 'Maps', icon: <Map size={iconSize} color={iconColor} /> },
    { table: 'map_keys', label: 'Map Keys', icon: <Key size={iconSize} color={iconColor} /> },
    { table: 'map_markers', label: 'Markers', icon: <MapPin size={iconSize} color={iconColor} /> },
    { table: 'marker_photos', label: 'Marker Photos', icon: <Image size={iconSize} color={iconColor} /> },
    { table: 'map_comments', label: 'Comments', icon: <MessageCircle size={iconSize} color={iconColor} /> },
    { table: 'map_paths', label: 'Paths', icon: <Route size={iconSize} color={iconColor} /> },
    { table: 'map_lists', label: 'Lists', icon: <List size={iconSize} color={iconColor} /> },
    { table: 'service_requests', label: 'Service Requests', icon: <Wrench size={iconSize} color={iconColor} /> },
  ];

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const handleSheetChange = useCallback((index: number) => {
    setSheetOpen(index >= 0);
  }, []);

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['70%', '90%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <H3>Data Sync</H3>
      </View>
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(40, bottomInset + 16) }]}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '12', borderColor: statusColor + '30' }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>{statusText}</Text>
          </View>
          <Text style={[styles.lastSyncText, { color: colors.textSecondary }]}>
            Last synced: {getRelativeTime(lastSyncedAt)}
          </Text>
        </View>

        {/* Reconnect button when offline */}
        {!isConnected && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.reconnectButton,
                { backgroundColor: isReconnecting ? colors.primary + '80' : colors.primary },
              ]}
              onPress={handleReconnect}
              disabled={isReconnecting}
              activeOpacity={0.8}
            >
              {isReconnecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <RefreshCw size={16} color="#fff" />
              )}
              <Text style={[styles.reconnectText, { color: '#fff' }]}>
                {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {reconnectError && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {reconnectError}
          </Text>
        )}

        {/* Pending changes */}
        {pendingCount > 0 && (
          <View style={[styles.pendingBanner, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '30' }]}>
            <Text style={[styles.pendingText, { color: colors.text }]}>
              {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending upload
            </Text>
          </View>
        )}

        {/* Data Counts */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            LOCAL DATA
          </Text>
        </View>

        {isCountsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading counts...
            </Text>
          </View>
        ) : (
          <View style={[styles.countsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {tables.map((table, index) => (
              <View
                key={table.table}
                style={[
                  styles.countRow,
                  index < tables.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.countRowLeft}>
                  <View style={[styles.countIcon, { backgroundColor: colors.primary + '10' }]}>
                    {table.icon}
                  </View>
                  <Text style={[styles.countLabel, { color: colors.text }]}>{table.label}</Text>
                </View>
                <Text style={[styles.countValue, { color: colors.text }]}>
                  {(counts[table.table] ?? 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Reset Local Data */}
        <TouchableOpacity
          style={[
            styles.resetButton,
            { borderColor: colors.danger + '60' },
            (resetCooldown > 0 || isResetting) && styles.resetButtonDisabled,
          ]}
          onPress={handleResetLocalData}
          disabled={resetCooldown > 0 || isResetting}
          activeOpacity={0.8}
        >
          {isResetting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Trash2 size={16} color={resetCooldown > 0 ? colors.textSecondary : colors.danger} />
          )}
          <Text
            style={[
              styles.resetButtonText,
              { color: resetCooldown > 0 ? colors.textSecondary : colors.danger },
            ]}
          >
            {isResetting
              ? 'Resetting...'
              : resetCooldown > 0
                ? `Reset Local Data (${resetCooldown}s)`
                : 'Reset Local Data'}
          </Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  statusBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  lastSyncText: {
    fontSize: 13,
    marginLeft: 18,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  actionButtons: {
    gap: 8,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reconnectText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 15,
  },
  countsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  countLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  countValue: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pendingBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
