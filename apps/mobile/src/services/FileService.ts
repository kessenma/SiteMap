import { Platform } from 'react-native';
import {
  CachesDirectoryPath,
  DocumentDirectoryPath,
  mkdir,
  copyFile,
  exists,
  stat,
  downloadFile,
} from '@dr.pogodin/react-native-fs';
import { API_CONFIG, AUTH_CONFIG } from '../config';
import { createMMKV } from 'react-native-mmkv';
import { getPowerSyncDatabase } from './powersync/PowerSyncService';
import { enqueueFileUpload } from './FileUploadQueue';

const storage = createMMKV({ id: 'auth-service' });

function getCacheDir() {
  return `${CachesDirectoryPath}/map-files`;
}

// ─── Offline-first upload ────────────────────────────────────────────

/**
 * Save a file for a record offline-first:
 * 1. Copy the picked file to a stable local path (so the temp URI doesn't expire)
 * 2. Store the local path as file_uri on the record
 * 3. Enqueue the file for background upload to S3
 *
 * When the upload completes, FileUploadQueue updates file_uri to the S3 key.
 */
export async function saveFileOfflineFirst(params: {
  localUri: string;
  fileName: string;
  mimeType: string;
  folder: string;
  tableName: string;
  recordId: string;
  columnName?: string;
}): Promise<{ localPath: string }> {
  const { localUri, fileName, mimeType, folder, tableName, recordId, columnName = 'file_uri' } = params;

  // Copy to a stable local directory so temp picker URIs don't expire
  const stableDir = `${DocumentDirectoryPath}/uploads/${folder}`;
  await mkdir(stableDir);
  const stablePath = `${stableDir}/${recordId}_${fileName}`;

  const sourceUri = Platform.OS === 'android'
    ? localUri
    : localUri.replace('file://', '');

  await copyFile(sourceUri, stablePath);

  const localPath = Platform.OS === 'android' ? `file://${stablePath}` : stablePath;

  // Enqueue for S3 upload when online
  await enqueueFileUpload({
    tableName,
    recordId,
    columnName,
    localUri: localPath,
    fileName,
    mimeType,
    folder,
  });

  return { localPath };
}

// ─── File URI helpers ────────────────────────────────────────────────

/**
 * Check whether a file_uri is a remote S3 key (vs a local device path).
 */
export function isRemoteFileUri(fileUri: string): boolean {
  return (
    !!fileUri &&
    !fileUri.startsWith('file://') &&
    !fileUri.startsWith('/') &&
    !fileUri.startsWith('content://')
  );
}

/**
 * Build an authenticated URL to fetch a file from the web server's /api/files proxy.
 */
export function getFileProxyUrl(fileUri: string): string {
  const baseUrl = API_CONFIG.current.BASE_URL;
  return `${baseUrl}/api/files?path=${encodeURIComponent(fileUri)}`;
}

/**
 * Get the session cookie for authenticated requests.
 */
export function getSessionCookie(): string {
  return storage.getString(AUTH_CONFIG.STORAGE_KEYS.SESSION) ?? '';
}

// ─── Resolve file URI (with media_cache) ─────────────────────────────

/**
 * Resolve a file_uri to a locally-displayable URI.
 * - Local paths are returned as-is.
 * - Remote S3 keys: check media_cache table first, then download + cache.
 */
export async function resolveFileUri(fileUri: string): Promise<string> {
  if (!isRemoteFileUri(fileUri)) {
    return fileUri;
  }

  const db = getPowerSyncDatabase();

  // 1. Check media_cache table (PowerSync local-only)
  const cached = await db.getAll<{ local_path: string }>(
    `SELECT local_path FROM media_cache WHERE id = ?`,
    [fileUri],
  );

  if (cached.length > 0 && cached[0].local_path) {
    const fileExists = await exists(
      cached[0].local_path.replace('file://', ''),
    );
    if (fileExists) {
      return cached[0].local_path;
    }
    // Cache entry exists but file is gone — remove stale entry
    await db.execute(`DELETE FROM media_cache WHERE id = ?`, [fileUri]);
  }

  // 2. Download through the authenticated proxy
  const cacheDir = getCacheDir();
  await mkdir(cacheDir);

  const cacheKey = fileUri.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cachedPath = `${cacheDir}/${cacheKey}`;

  const url = getFileProxyUrl(fileUri);
  const sessionCookie = getSessionCookie();

  const downloadResult = await downloadFile({
    fromUrl: url,
    toFile: cachedPath,
    headers: { Cookie: sessionCookie },
  }).promise;

  if (downloadResult.statusCode !== 200) {
    throw new Error(`File download failed (${downloadResult.statusCode})`);
  }

  const localPath = Platform.OS === 'android' ? `file://${cachedPath}` : cachedPath;

  // 3. Save to media_cache for future offline access
  const now = new Date().toISOString();
  const fileStat = await stat(cachedPath);

  await db.execute(
    `INSERT OR REPLACE INTO media_cache (id, local_path, content_type, file_size, cached_at)
     VALUES (?, ?, ?, ?, ?)`,
    [fileUri, localPath, '', Number(fileStat.size) || 0, now],
  );

  return localPath;
}
