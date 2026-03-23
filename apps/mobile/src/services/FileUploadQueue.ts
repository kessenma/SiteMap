import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { generateUUID } from '../utils/uuid';
import { API_CONFIG, AUTH_CONFIG } from '../config';
import { createMMKV } from 'react-native-mmkv';
import { getPowerSyncDatabase } from './powersync/PowerSyncService';
import type { FileUploadQueueRecord } from '../db/powerSyncSchema';

const storage = createMMKV({ id: 'auth-service' });

const MAX_RETRIES = 5;

/**
 * Enqueue a file for upload to S3.
 * The record is saved to the local file_upload_queue table and will be
 * processed when connectivity is available.
 */
export async function enqueueFileUpload(params: {
  tableName: string;
  recordId: string;
  columnName: string;
  localUri: string;
  fileName: string;
  mimeType: string;
  folder: string;
}): Promise<void> {
  const db = getPowerSyncDatabase();
  const now = new Date().toISOString();
  const id = generateUUID();

  await db.execute(
    `INSERT INTO file_upload_queue (id, table_name, record_id, column_name, local_uri, file_name, mime_type, folder, status, retry_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [id, params.tableName, params.recordId, params.columnName, params.localUri, params.fileName, params.mimeType, params.folder, now],
  );

  // Try to process immediately
  processUploadQueue().catch(() => {});
}

/**
 * Process all pending uploads in the queue.
 * Called automatically after enqueue and can be called on app foreground / connectivity change.
 */
export async function processUploadQueue(): Promise<void> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const db = getPowerSyncDatabase();

  const pending = await db.getAll<FileUploadQueueRecord & { id: string }>(
    `SELECT * FROM file_upload_queue WHERE status IN ('pending', 'failed') AND retry_count < ? ORDER BY created_at ASC`,
    [MAX_RETRIES],
  );

  for (const item of pending) {
    await processOneUpload(item);
  }
}

async function processOneUpload(item: FileUploadQueueRecord & { id: string }): Promise<void> {
  const db = getPowerSyncDatabase();
  const now = new Date().toISOString();

  // Mark as uploading
  await db.execute(
    `UPDATE file_upload_queue SET status = 'uploading', attempted_at = ? WHERE id = ?`,
    [now, item.id],
  );

  try {
    const baseUrl = API_CONFIG.current.BASE_URL;
    const sessionCookie = storage.getString(AUTH_CONFIG.STORAGE_KEYS.SESSION) ?? '';

    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'android' ? item.local_uri : item.local_uri?.replace('file://', ''),
      name: item.file_name ?? 'file',
      type: item.mime_type ?? 'application/octet-stream',
    } as any);
    formData.append('folder', item.folder ?? 'maps');

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed (${res.status})`);
    }

    const { filePath } = await res.json();

    // Update the owning record's file_uri to the S3 key
    await db.execute(
      `UPDATE ${item.table_name} SET ${item.column_name} = ?, updated_at = ? WHERE id = ?`,
      [filePath, now, item.record_id],
    );

    // Remove from queue — upload complete
    await db.execute(`DELETE FROM file_upload_queue WHERE id = ?`, [item.id]);

    console.log(`[FileUploadQueue] Uploaded ${item.file_name} → ${filePath}`);
  } catch (err: any) {
    console.warn(`[FileUploadQueue] Failed to upload ${item.file_name}:`, err.message);

    // Mark as failed, increment retry count
    await db.execute(
      `UPDATE file_upload_queue SET status = 'failed', retry_count = retry_count + 1, error = ?, attempted_at = ? WHERE id = ?`,
      [err.message ?? 'Unknown error', now, item.id],
    );
  }
}

/**
 * Get the count of pending uploads.
 */
export async function getPendingUploadCount(): Promise<number> {
  const db = getPowerSyncDatabase();
  const result = await db.getAll<{ count: number }>(
    `SELECT COUNT(*) as count FROM file_upload_queue WHERE status IN ('pending', 'failed') AND retry_count < ?`,
    [MAX_RETRIES],
  );
  return result[0]?.count ?? 0;
}

/**
 * Check if a specific record has a pending file upload.
 */
export async function hasPendingUpload(tableName: string, recordId: string): Promise<boolean> {
  const db = getPowerSyncDatabase();
  const result = await db.getAll<{ count: number }>(
    `SELECT COUNT(*) as count FROM file_upload_queue WHERE table_name = ? AND record_id = ? AND status != 'completed'`,
    [tableName, recordId],
  );
  return (result[0]?.count ?? 0) > 0;
}
