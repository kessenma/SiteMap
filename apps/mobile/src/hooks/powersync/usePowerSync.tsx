import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { AbstractPowerSyncDatabase, SyncStatus } from '@powersync/react-native';
import {
  PowerSyncService,
  initializePowerSync,
  getPowerSyncDatabase,
  disconnectPowerSync,
} from '../../services/powersync/PowerSyncService';

interface PowerSyncContextValue {
  db: AbstractPowerSyncDatabase | null;
  isReady: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  hasSynced: boolean;
  lastSyncedAt: Date | undefined;
  error: Error | null;
  reconnect: () => Promise<void>;
  resetLocalDatabase: () => Promise<void>;
  getPendingChangesCount: () => Promise<number>;
}

const PowerSyncContext = createContext<PowerSyncContextValue>({
  db: null,
  isReady: false,
  isConnected: false,
  isConnecting: false,
  hasSynced: false,
  lastSyncedAt: undefined,
  error: null,
  reconnect: async () => {},
  resetLocalDatabase: async () => {},
  getPendingChangesCount: async () => 0,
});

interface PowerSyncProviderProps {
  children: ReactNode;
  getToken?: () => Promise<string>;
}

export function PowerSyncProvider({ children, getToken }: PowerSyncProviderProps) {
  const [db, setDb] = useState<AbstractPowerSyncDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | undefined>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyStatus = (status: SyncStatus) => {
      if (cancelled) return;
      setIsConnected(status.connected);
      setIsConnecting(status.connecting);
      setHasSynced(status.hasSynced === true);
      setLastSyncedAt(status.lastSyncedAt);
    };

    const init = async () => {
      try {
        const service = PowerSyncService.getInstance();

        if (getToken) {
          await initializePowerSync(getToken);
        } else {
          // Offline-only mode
          const database = getPowerSyncDatabase();
          await database.init();
        }

        const database = service.getDatabase();
        if (!cancelled && database) {
          setDb(database);
          setIsReady(true);

          // Read initial status
          applyStatus(database.currentStatus);

          // Listen for status changes via the service event system
          service.addEventListener('onSyncStatusChange', (status) => {
            applyStatus(status);
          });
        }
      } catch (err) {
        console.error('[PowerSyncProvider] Init error:', err);
        if (!cancelled) {
          setError(err as Error);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      const service = PowerSyncService.getInstance();
      service.removeEventListener('onSyncStatusChange');
      disconnectPowerSync();
    };
  }, [getToken]);

  const reconnect = useCallback(async () => {
    await PowerSyncService.getInstance().reconnect();
  }, []);

  const resetLocalDatabase = useCallback(async () => {
    await PowerSyncService.getInstance().resetLocalDatabase();
    // Re-read the new database instance after reset
    const newDb = PowerSyncService.getInstance().getDatabase();
    if (newDb) {
      setDb(newDb);
    }
  }, []);

  const getPendingChangesCount = useCallback(async () => {
    return PowerSyncService.getInstance().getPendingChangesCount();
  }, []);

  return (
    <PowerSyncContext.Provider
      value={{
        db,
        isReady,
        isConnected,
        isConnecting,
        hasSynced,
        lastSyncedAt,
        error,
        reconnect,
        resetLocalDatabase,
        getPendingChangesCount,
      }}
    >
      {children}
    </PowerSyncContext.Provider>
  );
}

export function usePowerSync() {
  const context = useContext(PowerSyncContext);
  if (!context) {
    throw new Error('usePowerSync must be used within a PowerSyncProvider');
  }
  return context;
}

/**
 * Execute a read query against the local PowerSync database.
 * Automatically re-runs when synced data changes the underlying tables.
 */
export function usePowerSyncQuery<T>(
  query: string,
  params: any[] = [],
  dependencies: any[] = [],
) {
  const { db, isReady } = usePowerSync();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queryError, setQueryError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!db || !isReady) return;
    setIsLoading(true);
    try {
      const results = await db.getAll<T>(query, params);
      setData(results);
      setQueryError(null);
    } catch (err) {
      console.error('[usePowerSyncQuery] Error:', err);
      setQueryError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [db, isReady, query, ...dependencies]);

  // Watch for changes — re-run query when underlying tables are modified by sync.
  // db.watch() yields T[] arrays (same format as getAll), providing initial results
  // and re-querying whenever the underlying tables change.
  useEffect(() => {
    if (!db || !isReady) return;

    const abortController = new AbortController();

    (async () => {
      try {
        for await (const results of db.watch(query, params, {
          signal: abortController.signal,
        })) {
          setData((results.rows?._array ?? []) as T[]);
          setQueryError(null);
          setIsLoading(false);
        }
      } catch (err) {
        // AbortError is expected on cleanup
        if ((err as Error).name !== 'AbortError') {
          console.error('[usePowerSyncQuery] Watch error:', err);
          setQueryError(err as Error);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [db, isReady, query, ...dependencies]);

  return { data, isLoading, error: queryError, refresh };
}

/**
 * Execute a write mutation against the local PowerSync database.
 * Changes are queued for upload when connectivity is available.
 */
export function usePowerSyncMutation() {
  const { db, isReady } = usePowerSync();

  const execute = useCallback(
    async (sql: string, params: any[] = []) => {
      if (!db || !isReady) {
        throw new Error('PowerSync database not ready');
      }
      return db.execute(sql, params);
    },
    [db, isReady],
  );

  return { execute };
}
