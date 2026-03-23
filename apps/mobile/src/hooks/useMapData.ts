import { useMemo, useCallback } from 'react';
import { usePowerSyncQuery } from './powersync/usePowerSync';
import type {
  MapRecord,
  MapKeyRecord,
  MapMarkerRecord,
  MapCommentRecord,
  CommentReplyRecord,
  CommentReactionRecord,
  CommentPhotoRecord,
  MapPathRecord,
  MapListRecord,
  MapListItemRecord,
  ListItemPhotoRecord,
} from '../db/powerSyncSchema';

// ── Aggregated types ────────────────────────────────────────────────────

export type AggregatedComment = MapCommentRecord & {
  replies: CommentReplyRecord[];
  reactions: CommentReactionRecord[];
  photos: CommentPhotoRecord[];
};

export type AggregatedListItem = MapListItemRecord & {
  listId: string | null;
  photos: ListItemPhotoRecord[];
};

export type AggregatedList = MapListRecord & {
  items: AggregatedListItem[];
};

export type MapData = {
  map: MapRecord | null;
  keys: MapKeyRecord[];
  markers: MapMarkerRecord[];
  comments: AggregatedComment[];
  paths: MapPathRecord[];
  lists: AggregatedList[];
  allListItems: AggregatedListItem[];
  isLoading: boolean;
  refresh: () => void;
};

/**
 * Consolidated hook that fetches all map-related data for a single map.
 * Runs multiple PowerSync queries and aggregates results into a single object.
 */
export function useMapData(mapId: string | null): MapData {
  const effectiveId = mapId ?? '';

  const { data: maps, isLoading: mapLoading, refresh: refreshMap } = usePowerSyncQuery<MapRecord>(
    'SELECT * FROM maps WHERE id = ? LIMIT 1',
    [effectiveId],
    [effectiveId],
  );

  const { data: keys, refresh: refreshKeys } = usePowerSyncQuery<MapKeyRecord>(
    'SELECT * FROM map_keys WHERE map_id = ? ORDER BY sort_order',
    [effectiveId],
    [effectiveId],
  );

  const { data: markers, refresh: refreshMarkers } = usePowerSyncQuery<MapMarkerRecord>(
    'SELECT * FROM map_markers WHERE map_id = ?',
    [effectiveId],
    [effectiveId],
  );

  const { data: rawComments, refresh: refreshComments } = usePowerSyncQuery<MapCommentRecord>(
    'SELECT * FROM map_comments WHERE map_id = ? ORDER BY created_at DESC',
    [effectiveId],
    [effectiveId],
  );

  // Fetch all replies for this map's comments
  const commentIds = rawComments.map((c) => c.id);
  const commentIdsStr = commentIds.length > 0 ? commentIds.map(() => '?').join(',') : "'__none__'";
  const { data: allReplies, refresh: refreshReplies } = usePowerSyncQuery<CommentReplyRecord>(
    `SELECT * FROM comment_replies WHERE comment_id IN (${commentIdsStr}) ORDER BY created_at ASC`,
    commentIds.length > 0 ? commentIds : [],
    [commentIdsStr],
  );

  const { data: allReactions, refresh: refreshReactions } = usePowerSyncQuery<CommentReactionRecord>(
    `SELECT * FROM comment_reactions WHERE comment_id IN (${commentIdsStr})`,
    commentIds.length > 0 ? commentIds : [],
    [commentIdsStr],
  );

  const { data: allCommentPhotos, refresh: refreshCommentPhotos } = usePowerSyncQuery<CommentPhotoRecord>(
    `SELECT * FROM comment_photos WHERE comment_id IN (${commentIdsStr})`,
    commentIds.length > 0 ? commentIds : [],
    [commentIdsStr],
  );

  const { data: paths, refresh: refreshPaths } = usePowerSyncQuery<MapPathRecord>(
    'SELECT * FROM map_paths WHERE map_id = ? ORDER BY created_at ASC',
    [effectiveId],
    [effectiveId],
  );

  const { data: rawLists, refresh: refreshLists } = usePowerSyncQuery<MapListRecord>(
    'SELECT * FROM map_lists WHERE map_id = ? ORDER BY created_at ASC',
    [effectiveId],
    [effectiveId],
  );

  const listIds = rawLists.map((l) => l.id);
  const listIdsStr = listIds.length > 0 ? listIds.map(() => '?').join(',') : "'__none__'";
  const { data: rawListItems, refresh: refreshListItems } = usePowerSyncQuery<MapListItemRecord>(
    `SELECT * FROM map_list_items WHERE list_id IN (${listIdsStr}) ORDER BY sort_order ASC`,
    listIds.length > 0 ? listIds : [],
    [listIdsStr],
  );

  const listItemIds = rawListItems.map((i) => i.id);
  const listItemIdsStr = listItemIds.length > 0 ? listItemIds.map(() => '?').join(',') : "'__none__'";
  const { data: allListItemPhotos, refresh: refreshListItemPhotos } = usePowerSyncQuery<ListItemPhotoRecord>(
    `SELECT * FROM list_item_photos WHERE list_item_id IN (${listItemIdsStr})`,
    listItemIds.length > 0 ? listItemIds : [],
    [listItemIdsStr],
  );

  // ── Aggregate data ──────────────────────────────────────────────────

  const comments = useMemo<AggregatedComment[]>(() => {
    return rawComments.map((c) => ({
      ...c,
      replies: allReplies.filter((r) => r.comment_id === c.id),
      reactions: allReactions.filter((r) => r.comment_id === c.id),
      photos: allCommentPhotos.filter((p) => p.comment_id === c.id),
    }));
  }, [rawComments, allReplies, allReactions, allCommentPhotos]);

  const allListItems = useMemo<AggregatedListItem[]>(() => {
    return rawListItems.map((item) => ({
      ...item,
      listId: item.list_id,
      photos: allListItemPhotos.filter((p) => p.list_item_id === item.id),
    }));
  }, [rawListItems, allListItemPhotos]);

  const lists = useMemo<AggregatedList[]>(() => {
    return rawLists.map((l) => ({
      ...l,
      items: allListItems.filter((i) => i.list_id === l.id),
    }));
  }, [rawLists, allListItems]);

  const refresh = useCallback(() => {
    refreshMap();
    refreshKeys();
    refreshMarkers();
    refreshComments();
    refreshReplies();
    refreshReactions();
    refreshCommentPhotos();
    refreshPaths();
    refreshLists();
    refreshListItems();
    refreshListItemPhotos();
  }, [
    refreshMap, refreshKeys, refreshMarkers, refreshComments,
    refreshReplies, refreshReactions, refreshCommentPhotos,
    refreshPaths, refreshLists, refreshListItems, refreshListItemPhotos,
  ]);

  return {
    map: maps[0] ?? null,
    keys,
    markers,
    comments,
    paths,
    lists,
    allListItems,
    isLoading: mapLoading,
    refresh,
  };
}
