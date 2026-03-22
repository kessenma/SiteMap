import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { AbstractPowerSyncDatabase } from '@powersync/react-native';
import {
  getPowerSyncDatabase,
  initializePowerSync,
  disconnectPowerSync,
} from '../../services/powersync/PowerSyncService';

interface PowerSyncContextValue {
  db: AbstractPowerSyncDatabase | null;
  isReady: boolean;
  isConnected: boolean;
  error: Error | null;
}

const PowerSyncContext = createContext<PowerSyncContextValue>({
  db: null,
  isReady: false,
  isConnected: false,
  error: null,
});

interface PowerSyncProviderProps {
  children: ReactNode;
  getToken?: () => Promise<string>;
}

export function PowerSyncProvider({ children, getToken }: PowerSyncProviderProps) {
  const [db, setDb] = useState<AbstractPowerSyncDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (getToken) {
          const database = await initializePowerSync(getToken);
          if (!cancelled) {
            setDb(database);
            setIsReady(true);
            setIsConnected(true);
          }
        } else {
          // Offline-only mode: init DB without sync connection
          const database = getPowerSyncDatabase();
          await database.init();
          if (!cancelled) {
            setDb(database);
            setIsReady(true);
          }
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
      disconnectPowerSync();
    };
  }, [getToken]);

  return (
    <PowerSyncContext.Provider value={{ db, isReady, isConnected, error }}>
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

  useEffect(() => {
    refresh();
  }, [refresh]);

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
