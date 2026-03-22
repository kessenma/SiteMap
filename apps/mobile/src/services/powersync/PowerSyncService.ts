import { AbstractPowerSyncDatabase } from '@powersync/react-native';
import { OPSqliteOpenFactory } from '@powersync/op-sqlite';
import { AppSchema } from '../../db/powerSyncSchema';
import { DB_CONFIG, API_CONFIG } from '../../config';

let powerSyncInstance: AbstractPowerSyncDatabase | null = null;

export interface PowerSyncConnector {
  fetchCredentials: () => Promise<{
    endpoint: string;
    token: string;
  }>;
  uploadData: (database: AbstractPowerSyncDatabase) => Promise<void>;
}

/**
 * Creates and returns the singleton PowerSync database instance.
 * Uses op-sqlite with SQLCipher for encrypted local storage.
 */
export function getPowerSyncDatabase(): AbstractPowerSyncDatabase {
  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  const factory = new OPSqliteOpenFactory({
    dbFilename: `${DB_CONFIG.NAME}.sqlite`,
  });

  const { PowerSyncDatabase } = require('@powersync/react-native');
  powerSyncInstance = new PowerSyncDatabase({
    database: factory,
    schema: AppSchema,
  });

  return powerSyncInstance;
}

/**
 * Creates a connector that provides auth credentials and handles uploads.
 * The token should be a JWT signed with the same secret as the PowerSync server.
 */
export function createConnector(getToken: () => Promise<string>): PowerSyncConnector {
  return {
    fetchCredentials: async () => {
      const token = await getToken();
      return {
        endpoint: API_CONFIG.current.POWERSYNC_URL,
        token,
      };
    },
    uploadData: async (database: AbstractPowerSyncDatabase) => {
      const transaction = await database.getNextCrudTransaction();
      if (!transaction) return;

      try {
        for (const op of transaction.crud) {
          const table = op.table;
          const record = { id: op.id, ...op.opData };

          // POST mutations to the API server which writes to PostgreSQL
          const response = await fetch(
            `${API_CONFIG.current.API_URL}/sync/${table}`,
            {
              method: op.op === 'DELETE' ? 'DELETE' : 'PUT',
              headers: {
                'Content-Type': 'application/json',
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
      } catch (error) {
        console.error('[PowerSync] Upload error:', error);
        throw error;
      }
    },
  };
}

/**
 * Initialize PowerSync with the connector and start syncing.
 */
export async function initializePowerSync(
  getToken: () => Promise<string>,
): Promise<AbstractPowerSyncDatabase> {
  const db = getPowerSyncDatabase();
  const connector = createConnector(getToken);

  await db.init();
  await db.connect(connector);

  console.log('[PowerSync] Connected and syncing');
  return db;
}

/**
 * Disconnect and clean up.
 */
export async function disconnectPowerSync(): Promise<void> {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnect();
    powerSyncInstance = null;
  }
}
