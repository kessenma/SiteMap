// Robust PowerSync service — singleton class modeled after fajr-medflow-emr.
// Handles connection lifecycle, reconnect with backoff, status tracking, and error recovery.

import {
  PowerSyncDatabase,
  AbstractPowerSyncDatabase,
  SyncStatus,
} from '@powersync/react-native';
import { OPSqliteOpenFactory } from '@powersync/op-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { AppSchema } from '../../db/powerSyncSchema';
import { DB_CONFIG, API_CONFIG } from '../../config';
import { processUploadQueue } from '../FileUploadQueue';

// --- Types ---

export interface PowerSyncServiceConfig {
  serverUrl: string;
  getToken: () => Promise<string>;
}

export interface PowerSyncServiceEvents {
  onSyncStatusChange: (status: SyncStatus) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
}

// --- Service Class ---

export class PowerSyncService {
  private db: PowerSyncDatabase | null = null;
  private config: PowerSyncServiceConfig | null = null;
  private _isInitialized = false;
  private _isConnecting = false;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private lastDisconnectTime: number | null = null;
  private busyErrorCount = 0;
  private isResettingDb = false;
  private syncStatus: SyncStatus | null = null;
  private eventListeners: Partial<PowerSyncServiceEvents> = {};
  private statusListenerDispose: (() => void) | null = null;

  // Singleton
  private static instance: PowerSyncService;
  static getInstance(): PowerSyncService {
    if (!PowerSyncService.instance) {
      PowerSyncService.instance = new PowerSyncService();
    }
    return PowerSyncService.instance;
  }

  // --- Public API ---

  async initialize(config: PowerSyncServiceConfig): Promise<void> {
    // If already initialized, check for stale singleton (hot-reload resilience)
    if (this._isInitialized || this._isConnecting) {
      if (this._isInitialized && this.db && !this.db.connected) {
        console.log('[PowerSync] Stale singleton detected (initialized but disconnected) — reconnecting');
        try {
          await this.reconnect();
        } catch (error) {
          console.error('[PowerSync] Stale singleton reconnect failed:', error);
        }
        return;
      }
      console.warn('[PowerSync] Already initialized or initializing');
      return;
    }

    try {
      this._isConnecting = true;
      this.config = config;

      const factory = new OPSqliteOpenFactory({
        dbFilename: `${DB_CONFIG.NAME}.sqlite`,
      });

      this.db = new PowerSyncDatabase({
        database: factory,
        schema: AppSchema,
      });

      console.log('[PowerSync] Database created');

      this.setupEventListeners();
      await this.connect();

      this._isInitialized = true;
      this._isConnecting = false;

      console.log('[PowerSync] Initialized successfully');
      this.eventListeners.onConnected?.();
    } catch (error) {
      this._isConnecting = false;
      console.error('[PowerSync] Initialization failed:', error);
      this.eventListeners.onError?.(error as Error);
      throw error;
    }
  }

  async reconnect(): Promise<void> {
    if (!this.db || !this.config) {
      console.warn('[PowerSync] Cannot reconnect: not initialized');
      return;
    }
    if (this.isReconnecting) {
      console.log('[PowerSync] Already reconnecting, skipping');
      return;
    }
    if (this.db.connected) {
      console.log('[PowerSync] Already connected, skipping reconnect');
      return;
    }

    this.isReconnecting = true;
    try {
      // Exponential backoff
      if (this.reconnectAttempts > 0) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`[PowerSync] Backoff: waiting ${delay}ms (attempt ${this.reconnectAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Cooldown after disconnect
      if (this.lastDisconnectTime) {
        const elapsed = Date.now() - this.lastDisconnectTime;
        const COOLDOWN_MS = 2000;
        if (elapsed < COOLDOWN_MS) {
          await new Promise(resolve => setTimeout(resolve, COOLDOWN_MS - elapsed));
        }
      }

      console.log('[PowerSync] Reconnecting sync stream...');
      await this.db.connect({
        fetchCredentials: this.fetchCredentials.bind(this),
        uploadData: this.uploadData.bind(this),
      });
      this.reconnectAttempts = 0;
      this.eventListeners.onConnected?.();
      console.log('[PowerSync] Sync stream reconnected');
    } catch (error) {
      this.reconnectAttempts++;
      console.error('[PowerSync] Reconnect failed:', error);
      throw error;
    } finally {
      this.isReconnecting = false;
    }
  }

  async resetLocalDatabase(): Promise<void> {
    if (this.isResettingDb || !this.db || !this.config) return;
    this.isResettingDb = true;
    try {
      // 1. Disconnect
      try { await this.db.disconnect(); } catch (_e) { /* ignore */ }

      // 2. Close DB
      try { await (this.db as any).close?.(); } catch (_e) { /* ignore */ }

      // 3. Dispose old listener
      this.statusListenerDispose?.();
      this.statusListenerDispose = null;

      // 4. Re-create database
      const factory = new OPSqliteOpenFactory({
        dbFilename: `${DB_CONFIG.NAME}.sqlite`,
      });
      this.db = new PowerSyncDatabase({
        database: factory,
        schema: AppSchema,
      });

      // 5. Re-setup listeners and reconnect
      this.setupEventListeners();
      await this.db.connect({
        fetchCredentials: this.fetchCredentials.bind(this),
        uploadData: this.uploadData.bind(this),
      });

      this.busyErrorCount = 0;
      this.isResettingDb = false;
      console.log('[PowerSync] Database reset and reconnected');
    } catch (error) {
      this.isResettingDb = false;
      console.error('[PowerSync] Database reset failed:', error);
      throw error;
    }
  }

  async getPendingChangesCount(): Promise<number> {
    if (!this.db) return 0;
    try {
      const result = await this.db.getAll<{ count: number }>(
        'SELECT count(*) as count FROM ps_crud',
      );
      return result[0]?.count ?? 0;
    } catch {
      return 0;
    }
  }

  getSyncStatus(): SyncStatus | null {
    return this.syncStatus;
  }

  isConnected(): boolean {
    return this.db?.connected ?? false;
  }

  isReady(): boolean {
    return this._isInitialized && this.db !== null;
  }

  getDatabase(): AbstractPowerSyncDatabase | null {
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.disconnect();
      this.lastDisconnectTime = Date.now();
      this._isInitialized = false;
      this.eventListeners.onDisconnected?.();
      console.log('[PowerSync] Disconnected');
    } catch (error) {
      console.error('[PowerSync] Disconnect failed:', error);
      throw error;
    }
  }

  addEventListener<K extends keyof PowerSyncServiceEvents>(
    event: K,
    listener: PowerSyncServiceEvents[K],
  ): void {
    this.eventListeners[event] = listener;
  }

  removeEventListener<K extends keyof PowerSyncServiceEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  // --- Private Methods ---

  private async connect(): Promise<void> {
    if (!this.db || !this.config) {
      throw new Error('[PowerSync] Not initialized');
    }

    // Test server liveness (non-fatal)
    try {
      console.log(`[PowerSync] Testing server: ${this.config.serverUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.config.serverUrl}/probes/liveness`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log(`[PowerSync] Server accessible, status: ${res.status}`);
    } catch (err) {
      console.warn(
        '[PowerSync] Server liveness check failed:',
        err instanceof Error ? err.message : err,
      );
    }

    // Connect
    await this.db.connect({
      fetchCredentials: this.fetchCredentials.bind(this),
      uploadData: this.uploadData.bind(this),
    });

    console.log('[PowerSync] Connected to server');

    // Process any pending file uploads from previous sessions
    processUploadQueue().catch(() => {});
  }

  private setupEventListeners(): void {
    if (!this.db) return;

    // Dispose previous listener if any
    this.statusListenerDispose?.();

    this.statusListenerDispose = this.db.registerListener({
      statusChanged: (status: SyncStatus) => {
        this.syncStatus = status;
        this.eventListeners.onSyncStatusChange?.(status);

        if (__DEV__) {
          console.log('[PowerSync] Status:', {
            connected: status.connected,
            connecting: status.connecting,
            hasSynced: status.hasSynced,
          });
        }

        // Reset counters on successful connection
        if (status.connected && !status.connecting) {
          this.busyErrorCount = 0;
          this.reconnectAttempts = 0;
        }

        // Handle SQLite BUSY errors — auto-reset after 3 consecutive
        if (status.dataFlowStatus?.downloadError) {
          const errMsg = status.dataFlowStatus.downloadError?.message || '';
          if (errMsg.includes('BUSY')) {
            this.busyErrorCount++;
            console.warn(`[PowerSync] SQLite BUSY (${this.busyErrorCount}/3)`);
            if (this.busyErrorCount >= 3 && !this.isResettingDb) {
              console.warn('[PowerSync] Persistent BUSY — resetting local database');
              this.resetLocalDatabase();
            }
          } else {
            console.error('[PowerSync] Download error:', status.dataFlowStatus.downloadError);
          }
        }
        if (status.dataFlowStatus?.uploadError) {
          console.error('[PowerSync] Upload error:', status.dataFlowStatus.uploadError);
        }
      },
    });
  }

  private async fetchCredentials(): Promise<{ endpoint: string; token: string }> {
    if (!this.config) throw new Error('[PowerSync] Not configured');

    const token = await this.config.getToken();
    return {
      endpoint: this.config.serverUrl,
      token,
    };
  }

  private async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      const token = await this.config!.getToken();

      for (const op of transaction.crud) {
        const table = op.table;
        const record = { id: op.id, ...op.opData };

        const response = await fetch(
          `${API_CONFIG.current.API_URL}/sync/${table}`,
          {
            method: op.op === 'DELETE' ? 'DELETE' : 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(record),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Sync upload failed for ${table}: ${response.status}`,
          );
        }
      }

      await transaction.complete();

      // Process any queued file uploads after syncing metadata
      processUploadQueue().catch((err) =>
        console.warn('[PowerSync] File upload queue error:', err),
      );
    } catch (error) {
      console.error('[PowerSync] Upload error:', error);
      throw error;
    }
  }
}

// --- Network listener for auto-reconnect ---

let netInfoUnsubscribe: (() => void) | null = null;

function setupNetworkListener() {
  if (netInfoUnsubscribe) return;
  netInfoUnsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      const service = PowerSyncService.getInstance();
      if (service.isReady() && !service.isConnected()) {
        service.reconnect().catch(() => {});
      }
      processUploadQueue().catch(() => {});
    }
  });
}

// --- Backward-compatible exports ---
// These delegate to the singleton so existing code (FileUploadQueue, etc.) keeps working.

export function getPowerSyncDatabase(): AbstractPowerSyncDatabase {
  const db = PowerSyncService.getInstance().getDatabase();
  if (!db) {
    // Fallback: create a DB without sync for offline-only access
    const factory = new OPSqliteOpenFactory({
      dbFilename: `${DB_CONFIG.NAME}.sqlite`,
    });
    const { PowerSyncDatabase: PSD } = require('@powersync/react-native');
    return new PSD({ database: factory, schema: AppSchema });
  }
  return db;
}

export async function initializePowerSync(
  getToken: () => Promise<string>,
): Promise<AbstractPowerSyncDatabase> {
  const service = PowerSyncService.getInstance();
  await service.initialize({
    serverUrl: API_CONFIG.current.POWERSYNC_URL,
    getToken,
  });
  setupNetworkListener();
  return service.getDatabase()!;
}

export async function disconnectPowerSync(): Promise<void> {
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  return PowerSyncService.getInstance().disconnect();
}
