import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import GorhomBottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { usePowerSyncMutation } from '../hooks/powersync/usePowerSync';
import { useAuth } from '../contexts/AuthContext';
import { useMapData } from '../hooks/useMapData';
import { saveFileOfflineFirst } from '../services/FileService';
import type { RootStackParamList } from '../navigation/MainNavigator';
import { DEFAULT_PATH_WIDTH } from '../components/map-viewer/map-constants';
import type { MapMode } from '../components/map-viewer/map-constants';

// Map viewer components
import { MapCanvas } from '../components/map-viewer/MapCanvas';
import { MapModeToolbar } from '../components/map-viewer/MapModeToolbar';
import { MapContentSheet, type SheetTab } from '../components/map-viewer/MapContentSheet';
import { LegendPanel } from '../components/map-viewer/LegendPanel';
import { MarkerDetailPanel } from '../components/map-viewer/MarkerDetailPanel';
import { CommentList } from '../components/map-viewer/CommentList';
import { CommentThread } from '../components/map-viewer/CommentThread';
import { CommentCreationCard } from '../components/map-viewer/CommentCreationCard';
import { PathList } from '../components/map-viewer/PathList';
import { PathDetailPanel } from '../components/map-viewer/PathDetailPanel';
import { PathSaveCard } from '../components/map-viewer/PathSaveCard';
import { LocationListPanel } from '../components/map-viewer/LocationListPanel';
import { ListItemDetail } from '../components/map-viewer/ListItemDetail';
import { ListItemCreationCard } from '../components/map-viewer/ListItemCreationCard';

import type { MapMarkerRecord, MapCommentRecord, MapKeyRecord } from '../db/powerSyncSchema';
import type { AggregatedListItem } from '../hooks/useMapData';
import { generateUUID } from '../utils/uuid';

type RouteType = RouteProp<RootStackParamList, 'MapViewer'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function MapViewerScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { execute } = usePowerSyncMutation();
  const { mapId } = route.params;
  const sheetRef = useRef<GorhomBottomSheet>(null);

  // ── Map data ─────────────────────────────────────────────────────────

  const {
    map,
    keys,
    markers,
    comments,
    paths,
    lists,
    allListItems,
    isLoading,
    refresh,
  } = useMapData(mapId);

  // ── UI state ─────────────────────────────────────────────────────────

  const [mode, setMode] = useState<MapMode>('select');
  const [activeTab, setActiveTab] = useState<SheetTab>('legend');

  // Selection state
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedListItemId, setSelectedListItemId] = useState<string | null>(null);

  // Drill-in state (first tap highlights, second tap expands detail)
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  // Live preview overrides for path editing
  const [pathPreview, setPathPreview] = useState<{ color: string; strokeWidth: number } | null>(null);

  // Creation state
  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [pendingPath, setPendingPath] = useState<{ x: number; y: number }[] | null>(null);
  const [pathLabel, setPathLabel] = useState('');
  const [pathColor, setPathColor] = useState('#3B82F6');
  const [pathWidth, setPathWidth] = useState(DEFAULT_PATH_WIDTH);
  const [pendingListItem, setPendingListItem] = useState<{ x: number; y: number } | null>(null);
  const [listItemLabel, setListItemLabel] = useState('');
  const [listItemDesc, setListItemDesc] = useState('');

  // Drawing state
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Derived data
  const keyMap = new Map(keys.map((k) => [k.id, k]));
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;
  const selectedComment = comments.find((c) => c.id === selectedCommentId) ?? null;
  const selectedPath = paths.find((p) => p.id === selectedPathId) ?? null;
  const selectedListItem = allListItems.find((i) => i.id === selectedListItemId) ?? null;
  const selectedList = lists.find((l) => l.id === selectedListId) ?? null;

  // Paths with live preview overrides for the canvas
  const viewerPaths = useMemo(() =>
    paths.map((p) =>
      p.id === selectedPathId && pathPreview
        ? { ...p, color: pathPreview.color, stroke_width: pathPreview.strokeWidth }
        : p
    ), [paths, selectedPathId, pathPreview]);

  // Pending path preview for canvas (shown before save)
  const pendingPathPreview = useMemo(() =>
    pendingPath ? { points: pendingPath, color: pathColor, strokeWidth: pathWidth } : null,
    [pendingPath, pathColor, pathWidth]);

  // ── Auto-switch tab on selection ──────────────────────────────────────

  useEffect(() => {
    if (selectedMarkerId) setActiveTab('details');
    else if (selectedCommentId) setActiveTab('comments');
    else if (selectedPathId) setActiveTab('paths');
    else if (selectedListItemId) setActiveTab('lists');
  }, [selectedMarkerId, selectedCommentId, selectedPathId, selectedListItemId]);

  // Expand sheet when selection changes
  useEffect(() => {
    if (selectedMarkerId || selectedCommentId || selectedPathId || selectedListItemId) {
      sheetRef.current?.snapToIndex(1); // 50%
    }
  }, [selectedMarkerId, selectedCommentId, selectedPathId, selectedListItemId]);

  // ── Map click handler ─────────────────────────────────────────────────

  const handleMapClick = useCallback((x: number, y: number) => {
    if (mode === 'add-comment') {
      setPendingComment({ x, y });
      setCommentText('');
    } else if (mode === 'add-list-item' && selectedListId) {
      setPendingListItem({ x, y });
      setListItemLabel('');
      setListItemDesc('');
    } else if (mode === 'draw-path' && isDrawing) {
      // Accumulate drawing point
      setDrawingPoints((prev) => {
        const last = prev[prev.length - 1];
        if (last) {
          const dx = x - last.x;
          const dy = y - last.y;
          if (dx * dx + dy * dy < 9) return prev;
        }
        return [...prev, { x, y }];
      });
    }
  }, [mode, selectedListId, isDrawing]);

  // ── Path drawing handlers ─────────────────────────────────────────────

  const handlePathDraw = useCallback((points: { x: number; y: number }[]) => {
    if (points.length === 1) {
      // Start drawing
      setIsDrawing(true);
      setDrawingPoints(points);
    } else if (points.length === 0) {
      // End drawing
      setIsDrawing(false);
      if (drawingPoints.length >= 2) {
        setPendingPath([...drawingPoints]);
        setPathLabel('');
        setPathColor('#3B82F6');
        setPathWidth(DEFAULT_PATH_WIDTH);
      }
      setDrawingPoints([]);
    }
  }, [drawingPoints]);

  // ── Selection handlers ────────────────────────────────────────────────

  const handleMarkerSelect = useCallback((marker: MapMarkerRecord | null) => {
    setSelectedMarkerId(marker?.id ?? null);
    if (marker) {
      setSelectedCommentId(null);
      setSelectedPathId(null);
      setSelectedListItemId(null);
      setExpandedComment(null);
      setExpandedPath(null);
    }
  }, []);

  const handleCommentSelect = useCallback((comment: MapCommentRecord | null) => {
    setSelectedCommentId(comment?.id ?? null);
    setExpandedComment(null); // map pin tap highlights, doesn't drill in
    if (comment) {
      setSelectedMarkerId(null);
      setSelectedPathId(null);
      setSelectedListItemId(null);
      setExpandedPath(null);
    }
  }, []);

  const handlePathSelect = useCallback((pathId: string | null) => {
    setSelectedPathId(pathId);
    setExpandedPath(null); // map path tap highlights, doesn't drill in
    setPathPreview(null);
    if (pathId) {
      setSelectedMarkerId(null);
      setSelectedCommentId(null);
      setSelectedListItemId(null);
      setExpandedComment(null);
    }
  }, []);

  const handleListItemSelect = useCallback((item: AggregatedListItem | null) => {
    setSelectedListItemId(item?.id ?? null);
    if (item) {
      setSelectedMarkerId(null);
      setSelectedCommentId(null);
      setSelectedPathId(null);
    }
  }, []);

  // ── Mutation handlers ─────────────────────────────────────────────────

  const handleSaveComment = useCallback(async () => {
    if (!pendingComment || !commentText.trim() || !user) return;
    const id = generateUUID();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO map_comments (id, map_id, x, y, content, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, mapId, pendingComment.x, pendingComment.y, commentText.trim(), user.id, now, now],
    );
    setPendingComment(null);
    setCommentText('');
    setMode('select');
    setActiveTab('comments');
    refresh();
  }, [pendingComment, commentText, mapId, user, execute, refresh]);

  const handleCommentReply = useCallback(async (commentId: string, content: string) => {
    if (!user) return;
    const id = generateUUID();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO comment_replies (id, comment_id, content, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, commentId, content, user.id, now, now],
    );
    refresh();
  }, [user, execute, refresh]);

  const handleToggleReaction = useCallback(async (commentId: string, emoji: string) => {
    if (!user) return;
    // Check if already reacted
    const existing = comments
      .find((c) => c.id === commentId)
      ?.reactions.find((r) => r.emoji === emoji && r.user_id === user.id);

    if (existing) {
      await execute('DELETE FROM comment_reactions WHERE id = ?', [existing.id]);
    } else {
      const id = generateUUID();
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO comment_reactions (id, comment_id, user_id, emoji, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, commentId, user.id, emoji, now],
      );
    }
    refresh();
  }, [user, comments, execute, refresh]);

  const handleResolve = useCallback(async (commentId: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    await execute(
      'UPDATE map_comments SET resolved_at = ?, resolved_by = ?, updated_at = ? WHERE id = ?',
      [now, user.id, now, commentId],
    );
    refresh();
  }, [user, execute, refresh]);

  const handleReopen = useCallback(async (commentId: string) => {
    const now = new Date().toISOString();
    await execute(
      'UPDATE map_comments SET resolved_at = NULL, resolved_by = NULL, updated_at = ? WHERE id = ?',
      [now, commentId],
    );
    refresh();
  }, [execute, refresh]);

  const handleCommentPhoto = useCallback(async (commentId: string, uri: string, fileName: string, fileSize: number) => {
    const id = generateUUID();
    const now = new Date().toISOString();
    const { localPath } = await saveFileOfflineFirst({
      localUri: uri,
      fileName,
      mimeType: 'image/jpeg',
      folder: 'comment-photos',
      tableName: 'comment_photos',
      recordId: id,
    });
    await execute(
      `INSERT INTO comment_photos (id, comment_id, file_uri, file_name, file_size, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, commentId, localPath, fileName, fileSize, now],
    );
    refresh();
  }, [execute, refresh]);

  const handleSavePath = useCallback(async () => {
    if (!pendingPath || !user) return;
    const id = generateUUID();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO map_paths (id, map_id, label, color, stroke_width, path_data, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, mapId, pathLabel, pathColor, pathWidth, JSON.stringify(pendingPath), user.id, now, now],
    );
    setPendingPath(null);
    setMode('select');
    setActiveTab('paths');
    refresh();
  }, [pendingPath, pathLabel, pathColor, pathWidth, mapId, user, execute, refresh]);

  const handleUpdatePath = useCallback(async (pathId: string, data: { label: string; color: string; strokeWidth: number }) => {
    const now = new Date().toISOString();
    await execute(
      'UPDATE map_paths SET label = ?, color = ?, stroke_width = ?, updated_at = ? WHERE id = ?',
      [data.label, data.color, data.strokeWidth, now, pathId],
    );
    refresh();
  }, [execute, refresh]);

  const handleDeletePath = useCallback(async (pathId: string) => {
    await execute('DELETE FROM map_paths WHERE id = ?', [pathId]);
    setSelectedPathId(null);
    setExpandedPath(null);
    setPathPreview(null);
    refresh();
  }, [execute, refresh]);

  const handleCreateList = useCallback(async (name: string, description: string) => {
    if (!user) return;
    const id = generateUUID();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO map_lists (id, map_id, name, description, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, mapId, name, description, user.id, now, now],
    );
    refresh();
  }, [mapId, user, execute, refresh]);

  const handleSaveListItem = useCallback(async () => {
    if (!pendingListItem || !selectedListId || !user) return;
    const list = lists.find((l) => l.id === selectedListId);
    const nextOrder = (list?.items.length ?? 0) + 1;
    const id = generateUUID();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO map_list_items (id, list_id, x, y, label, description, sort_order, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, selectedListId, pendingListItem.x, pendingListItem.y,
        listItemLabel || `Item ${nextOrder}`, listItemDesc, nextOrder, 'pending', now, now,
      ],
    );
    setPendingListItem(null);
    refresh();
  }, [pendingListItem, selectedListId, listItemLabel, listItemDesc, lists, user, execute, refresh]);

  const handleUpdateItemStatus = useCallback(async (itemId: string, status: string) => {
    const now = new Date().toISOString();
    const completedFields = status === 'completed'
      ? ', completed_by = ?, completed_at = ?'
      : ', completed_by = NULL, completed_at = NULL';
    const params = status === 'completed'
      ? [status, now, user?.id ?? '', now, itemId]
      : [status, now, itemId];
    await execute(
      `UPDATE map_list_items SET status = ?, updated_at = ?${completedFields} WHERE id = ?`,
      params,
    );
    refresh();
  }, [user, execute, refresh]);

  const handleListItemPhoto = useCallback(async (itemId: string, uri: string, fileName: string, fileSize: number) => {
    const id = generateUUID();
    const now = new Date().toISOString();
    const { localPath } = await saveFileOfflineFirst({
      localUri: uri,
      fileName,
      mimeType: 'image/jpeg',
      folder: 'list-photos',
      tableName: 'list_item_photos',
      recordId: id,
    });
    await execute(
      `INSERT INTO list_item_photos (id, list_item_id, file_uri, file_name, file_size, caption, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, itemId, localPath, fileName, fileSize, '', now],
    );
    refresh();
  }, [execute, refresh]);

  // ── Upload handlers (kept from original) ──────────────────────────────

  const uploadMap = useCallback(async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
      if (result.assets?.[0]) {
        const asset = result.assets[0];
        const id = generateUUID();
        const now = new Date().toISOString();
        const fileName = asset.fileName ?? 'map.jpg';
        const mimeType = fileName.toLowerCase().endsWith('.png')
          ? 'image/png'
          : fileName.toLowerCase().endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';

        const { localPath } = await saveFileOfflineFirst({
          localUri: asset.uri ?? '',
          fileName,
          mimeType,
          folder: 'maps',
          tableName: 'maps',
          recordId: id,
        });

        await execute(
          `INSERT INTO maps (id, project_id, name, description, file_type, file_uri, file_name, file_size, width, height, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, mapId, fileName, '', 'image', localPath, fileName, asset.fileSize ?? 0, asset.width ?? 0, asset.height ?? 0, user?.id ?? '', now, now],
        );
        refresh();
      }
    } catch (err) {
      Alert.alert('Upload Error', (err as any).message || 'Failed to upload.');
    }
  }, [mapId, user, execute, refresh]);

  // ── Sheet tab config ──────────────────────────────────────────────────

  const tabs = [
    { key: 'legend' as SheetTab, label: 'Legend', count: keys.length },
    { key: 'comments' as SheetTab, label: 'Comments', count: comments.length },
    { key: 'paths' as SheetTab, label: 'Paths', count: paths.length },
    { key: 'lists' as SheetTab, label: 'Lists', count: lists.length },
    { key: 'details' as SheetTab, label: 'Details' },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!map) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Map Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Upload a map image to get started
        </Text>
        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
          onPress={uploadMap}
        >
          <Text style={styles.uploadBtnText}>Upload Image</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map canvas */}
      <View style={styles.mapArea}>
        <MapCanvas
          fileUri={map.file_uri}
          fileType={map.file_type}
          mapWidth={map.width ?? 1000}
          mapHeight={map.height ?? 800}
          markers={markers}
          keys={keys}
          selectedMarkerId={selectedMarkerId}
          onMarkerSelect={handleMarkerSelect}
          mode={mode}
          onMapClick={handleMapClick}
          comments={comments}
          selectedCommentId={selectedCommentId}
          onCommentSelect={handleCommentSelect}
          paths={viewerPaths}
          selectedPathId={selectedPathId}
          onPathSelect={handlePathSelect}
          onPathDraw={handlePathDraw}
          listItems={allListItems}
          selectedListItemId={selectedListItemId}
          onListItemSelect={handleListItemSelect}
          drawingPoints={drawingPoints}
          isDrawing={isDrawing}
          pendingPath={pendingPathPreview}
        />

        {/* Floating toolbar */}
        <View style={styles.toolbarOverlay}>
          <MapModeToolbar mode={mode} onModeChange={setMode} />
        </View>

        {/* Mode hint */}
        {mode !== 'select' && (
          <View style={[styles.modeHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modeHintText, { color: colors.textSecondary }]}>
              {mode === 'add-comment' && 'Tap on the map to place a comment'}
              {mode === 'draw-path' && 'Drag with one finger to draw a path'}
              {mode === 'add-list-item' && (selectedListId
                ? 'Tap on the map to place a list item'
                : 'Select a list first in the Lists tab')}
            </Text>
          </View>
        )}

        {/* Floating creation cards */}
        {pendingComment && (
          <CommentCreationCard
            position={pendingComment}
            text={commentText}
            onTextChange={setCommentText}
            onSave={handleSaveComment}
            onCancel={() => setPendingComment(null)}
          />
        )}

        {pendingPath && (
          <PathSaveCard
            pointCount={pendingPath.length}
            label={pathLabel}
            onLabelChange={setPathLabel}
            color={pathColor}
            onColorChange={setPathColor}
            strokeWidth={pathWidth}
            onStrokeWidthChange={setPathWidth}
            onSave={handleSavePath}
            onDiscard={() => setPendingPath(null)}
          />
        )}

        {pendingListItem && selectedList && (
          <ListItemCreationCard
            position={pendingListItem}
            listName={selectedList.name ?? 'Untitled List'}
            label={listItemLabel}
            onLabelChange={setListItemLabel}
            description={listItemDesc}
            onDescriptionChange={setListItemDesc}
            onSave={handleSaveListItem}
            onCancel={() => setPendingListItem(null)}
          />
        )}
      </View>

      {/* Bottom sheet */}
      <MapContentSheet
        sheetRef={sheetRef}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      >
        {activeTab === 'legend' && (
          <LegendPanel keys={keys} markers={markers} />
        )}

        {activeTab === 'comments' && (
          selectedComment && expandedComment === selectedCommentId ? (
            <>
              <TouchableOpacity
                onPress={() => { setExpandedComment(null); setSelectedCommentId(null); }}
                style={styles.backLink}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{'\u2190'} All comments</Text>
              </TouchableOpacity>
              <CommentThread
                comment={selectedComment}
                onReply={handleCommentReply}
                onToggleReaction={handleToggleReaction}
                onResolve={handleResolve}
                onReopen={handleReopen}
                onAddPhoto={handleCommentPhoto}
              />
            </>
          ) : (
            <CommentList
              comments={comments}
              selectedCommentId={selectedCommentId}
              onSelect={(commentId) => {
                if (selectedCommentId === commentId) {
                  setExpandedComment(commentId);
                } else {
                  setSelectedCommentId(commentId);
                }
              }}
            />
          )
        )}

        {activeTab === 'paths' && (
          selectedPath && expandedPath === selectedPathId ? (
            <>
              <TouchableOpacity
                onPress={() => { setExpandedPath(null); setSelectedPathId(null); setPathPreview(null); }}
                style={styles.backLink}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{'\u2190'} All paths</Text>
              </TouchableOpacity>
              <PathDetailPanel
                path={selectedPath}
                onUpdate={(pathId, data) => { setPathPreview(null); handleUpdatePath(pathId, data); }}
                onDelete={handleDeletePath}
                onPreview={setPathPreview}
              />
            </>
          ) : (
            <PathList
              paths={paths}
              selectedPathId={selectedPathId}
              onSelect={(pathId) => {
                if (selectedPathId === pathId) {
                  setExpandedPath(pathId);
                } else {
                  setSelectedPathId(pathId);
                }
              }}
            />
          )
        )}

        {activeTab === 'lists' && (
          <>
            <LocationListPanel
              lists={lists}
              selectedListId={selectedListId}
              selectedItemId={selectedListItemId}
              onSelectList={setSelectedListId}
              onSelectItem={setSelectedListItemId}
              onCreateList={handleCreateList}
              onUpdateItemStatus={handleUpdateItemStatus}
            />
            {selectedListItem && (
              <ListItemDetail
                item={selectedListItem}
                onUpdateStatus={handleUpdateItemStatus}
                onAddPhoto={handleListItemPhoto}
              />
            )}
          </>
        )}

        {activeTab === 'details' && (
          selectedMarker ? (
            <MarkerDetailPanel
              marker={selectedMarker}
              keyDef={selectedMarker.key_id ? keyMap.get(selectedMarker.key_id) : undefined}
              onViewFull={() =>
                navigation.navigate('MarkerDetail', {
                  markerId: selectedMarker.id,
                  markerLabel: selectedMarker.label || (selectedMarker.key_id ? keyMap.get(selectedMarker.key_id)?.label : null) || 'Marker',
                })
              }
            />
          ) : (
            <View style={styles.emptyTab}>
              <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                {markers.length > 0
                  ? 'Tap a marker on the map to see details.'
                  : 'No markers on this map yet.'}
              </Text>
            </View>
          )
        )}
      </MapContentSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapArea: {
    flex: 1,
  },
  toolbarOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  modeHint: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeHintText: {
    fontSize: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  uploadBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyTab: {
    padding: 16,
    alignItems: 'center',
  },
  emptyTabText: {
    fontSize: 13,
  },
  backLink: {
    paddingVertical: 4,
    marginBottom: 6,
  },
});
