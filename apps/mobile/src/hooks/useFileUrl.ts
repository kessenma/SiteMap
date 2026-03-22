import { useEffect, useState } from 'react';
import { resolveFileUri, isRemoteFileUri } from '../services/FileService';

/**
 * Resolves a file_uri (local path or S3 key) to a displayable local URI.
 * Remote S3 keys are downloaded through the authenticated API proxy and cached.
 * Returns null while loading.
 */
export function useFileUrl(fileUri: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(() => {
    if (!fileUri) return null;
    // If it's already a local path, return immediately
    if (!isRemoteFileUri(fileUri)) return fileUri;
    return null;
  });

  useEffect(() => {
    if (!fileUri) {
      setResolved(null);
      return;
    }

    if (!isRemoteFileUri(fileUri)) {
      setResolved(fileUri);
      return;
    }

    let cancelled = false;
    resolveFileUri(fileUri)
      .then((url) => {
        if (!cancelled) setResolved(url);
      })
      .catch((err) => {
        console.warn('[useFileUrl] Failed to resolve:', fileUri, err);
        if (!cancelled) setResolved(null);
      });

    return () => {
      cancelled = true;
    };
  }, [fileUri]);

  return resolved;
}
