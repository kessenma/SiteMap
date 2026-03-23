import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, {
  Image as SvgImage,
  Circle,
  Path as SvgPath,
  G,
  Text as SvgText,
  Rect,
  Polyline,
} from 'react-native-svg';
import { useFileUrl } from '../../hooks/useFileUrl';
import { useTheme } from '../../contexts/ThemeContext';
import {
  MARKER_SIZES,
  SHAPE_PATHS,
  LIST_ITEM_STATUS_COLORS,
} from './map-constants';
import type { MapMode } from './map-constants';
import type {
  MapKeyRecord,
  MapMarkerRecord,
  MapCommentRecord,
  MapPathRecord,
} from '../../db/powerSyncSchema';
import type { AggregatedListItem } from '../../hooks/useMapData';

// ── Props ────────────────────────────────────────────────────────────────

type MapCanvasProps = {
  fileUri: string | null;
  fileType: string | null;
  mapWidth: number;
  mapHeight: number;
  markers: MapMarkerRecord[];
  keys: MapKeyRecord[];
  selectedMarkerId: string | null;
  onMarkerSelect: (marker: MapMarkerRecord | null) => void;
  mode: MapMode;
  onMapClick?: (x: number, y: number) => void;
  comments: MapCommentRecord[];
  selectedCommentId: string | null;
  onCommentSelect: (comment: MapCommentRecord | null) => void;
  paths: MapPathRecord[];
  selectedPathId: string | null;
  onPathSelect: (pathId: string | null) => void;
  onPathDraw?: (points: { x: number; y: number }[]) => void;
  listItems: AggregatedListItem[];
  selectedListItemId: string | null;
  onListItemSelect: (item: AggregatedListItem | null) => void;
  drawingPoints?: { x: number; y: number }[];
  isDrawing?: boolean;
};

// ── Marker rendering ────────────────────────────────────────────────────

function MarkerDot({
  marker,
  keyDef,
  isSelected,
}: {
  marker: MapMarkerRecord;
  keyDef: MapKeyRecord | undefined;
  isSelected: boolean;
}) {
  const color = keyDef?.icon_color ?? '#3B82F6';
  const shape = keyDef?.icon_shape ?? 'circle';
  const iconType = keyDef?.icon_type ?? 'shape';
  const sizeKey = (keyDef?.marker_size ?? 'md') as keyof typeof MARKER_SIZES;
  const size = MARKER_SIZES[sizeKey] ?? 24;
  const half = size / 2;

  const strokeColor = isSelected ? '#fff' : 'rgba(0,0,0,0.3)';
  const strokeW = isSelected ? 3 : 1.5;

  const renderIcon = () => {
    if (iconType === 'text') {
      const txt = keyDef?.icon_text ?? '?';
      return (
        <>
          <Circle r={half} fill={color} stroke={strokeColor} strokeWidth={strokeW} />
          <SvgText
            textAnchor="middle"
            alignmentBaseline="central"
            fill="#fff"
            fontSize={size * 0.5}
            fontWeight="700"
          >
            {txt.slice(0, 2)}
          </SvgText>
        </>
      );
    }

    // Default: shape
    if (shape === 'circle') {
      return <Circle r={half} fill={color} stroke={strokeColor} strokeWidth={strokeW} />;
    }
    return (
      <SvgPath
        d={SHAPE_PATHS[shape]?.(size) ?? ''}
        fill={color}
        stroke={strokeColor}
        strokeWidth={strokeW}
      />
    );
  };

  return (
    <G x={marker.x ?? 0} y={marker.y ?? 0}>
      {renderIcon()}
      {isSelected && marker.label ? (
        <G y={-half - 8}>
          <Rect x={-40} y={-14} width={80} height={20} rx={4} fill="rgba(0,0,0,0.75)" />
          <SvgText
            textAnchor="middle"
            y={0}
            fill="#fff"
            fontSize={11}
          >
            {marker.label.length > 12 ? marker.label.slice(0, 12) + '\u2026' : marker.label}
          </SvgText>
        </G>
      ) : null}
    </G>
  );
}

// ── Comment pin ─────────────────────────────────────────────────────────

function CommentPinSvg({
  comment,
  isSelected,
}: {
  comment: MapCommentRecord;
  isSelected: boolean;
}) {
  const isResolved = !!comment.resolved_at;
  return (
    <G x={comment.x ?? 0} y={comment.y ?? 0} opacity={isResolved ? 0.5 : 1}>
      <SvgPath
        d="M0,-16 C-8,-16 -12,-10 -12,-6 C-12,2 0,12 0,12 C0,12 12,2 12,-6 C12,-10 8,-16 0,-16Z"
        fill={isSelected ? '#3B82F6' : '#6366F1'}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
        strokeWidth={isSelected ? 2 : 1}
      />
      <Circle cy={-6} r={4} fill="#fff" />
      {isResolved && (
        <SvgText textAnchor="middle" y={-3} fill="#10B981" fontSize={8} fontWeight="bold">
          {'\u2713'}
        </SvgText>
      )}
    </G>
  );
}

// ── List item pin ───────────────────────────────────────────────────────

function ListItemPinSvg({
  item,
  isSelected,
}: {
  item: AggregatedListItem;
  isSelected: boolean;
}) {
  const color = LIST_ITEM_STATUS_COLORS[item.status ?? 'pending'] ?? '#9CA3AF';
  return (
    <G x={item.x ?? 0} y={item.y ?? 0}>
      <Circle
        r={10}
        fill={color}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
        strokeWidth={isSelected ? 3 : 1.5}
      />
      <SvgText
        textAnchor="middle"
        alignmentBaseline="central"
        fill="#fff"
        fontSize={10}
        fontWeight="700"
      >
        {item.sort_order ?? 0}
      </SvgText>
    </G>
  );
}

// ── Path overlay ────────────────────────────────────────────────────────

function PathOverlaySvg({
  paths,
  selectedPathId,
}: {
  paths: MapPathRecord[];
  selectedPathId: string | null;
}) {
  return (
    <G>
      {paths.map((p) => {
        let points: { x: number; y: number }[];
        try {
          points = JSON.parse(p.path_data ?? '[]');
        } catch {
          return null;
        }
        const pointsStr = points.map((pt) => `${pt.x},${pt.y}`).join(' ');
        const isSelected = selectedPathId === p.id;

        return (
          <G key={p.id}>
            {/* Selection outline */}
            {isSelected && (
              <Polyline
                points={pointsStr}
                fill="none"
                stroke="#fff"
                strokeWidth={(p.stroke_width ?? 2) + 4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Visible path */}
            <Polyline
              points={pointsStr}
              fill="none"
              stroke={p.color ?? '#3B82F6'}
              strokeWidth={p.stroke_width ?? 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isSelected ? 1 : 0.8}
            />
            {/* Wide invisible hit area for tapping */}
            <Polyline
              points={pointsStr}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              strokeLinecap="round"
            />
            {/* Label at midpoint */}
            {p.label && points.length > 1 ? (() => {
              const mid = points[Math.floor(points.length / 2)];
              return (
                <G x={mid.x} y={mid.y - 12}>
                  <Rect
                    x={-30}
                    y={-10}
                    width={60}
                    height={16}
                    rx={3}
                    fill="rgba(0,0,0,0.65)"
                  />
                  <SvgText
                    textAnchor="middle"
                    y={2}
                    fill="#fff"
                    fontSize={9}
                  >
                    {(p.label ?? '').length > 10 ? (p.label ?? '').slice(0, 10) + '\u2026' : p.label}
                  </SvgText>
                </G>
              );
            })() : null}
          </G>
        );
      })}
    </G>
  );
}

// ── Main MapCanvas ──────────────────────────────────────────────────────

export function MapCanvas({
  fileUri,
  fileType,
  mapWidth,
  mapHeight,
  markers,
  keys,
  selectedMarkerId,
  onMarkerSelect,
  mode,
  onMapClick,
  comments,
  selectedCommentId,
  onCommentSelect,
  paths,
  selectedPathId,
  onPathSelect,
  onPathDraw,
  listItems,
  selectedListItemId,
  onListItemSelect,
  drawingPoints = [],
  isDrawing = false,
}: MapCanvasProps) {
  const { colors } = useTheme();
  const resolvedUri = useFileUrl(fileType === 'image' ? fileUri : null);

  // Layout dimensions
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  // Transform state
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Saved transform (for gesture composition)
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const vw = mapWidth || 1000;
  const vh = mapHeight || 800;

  const keyMap = useMemo(
    () => new Map(keys.map((k) => [k.id, k])),
    [keys],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width;
    containerHeight.value = e.nativeEvent.layout.height;
  }, [containerWidth, containerHeight]);

  // ── Tap handler ─────────────────────────────────────────────────────

  const handleTap = useCallback((absX: number, absY: number) => {
    // Convert screen coordinates to SVG/map coordinates
    const cw = containerWidth.value;
    const ch = containerHeight.value;
    if (cw === 0 || ch === 0) return;

    // Account for aspect ratio fitting
    const containerAspect = cw / ch;
    const mapAspect = vw / vh;

    let renderedW: number;
    let renderedH: number;
    let offsetX: number;
    let offsetY: number;

    if (containerAspect > mapAspect) {
      // Container is wider, map fits by height
      renderedH = ch;
      renderedW = ch * mapAspect;
      offsetX = (cw - renderedW) / 2;
      offsetY = 0;
    } else {
      // Container is taller, map fits by width
      renderedW = cw;
      renderedH = cw / mapAspect;
      offsetX = 0;
      offsetY = (ch - renderedH) / 2;
    }

    // Map from screen space (accounting for transform) to SVG coordinates
    const s = scale.value;
    const tx = translateX.value;
    const ty = translateY.value;

    const mapX = ((absX - tx) / s - offsetX) / renderedW * vw;
    const mapY = ((absY - ty) / s - offsetY) / renderedH * vh;

    // Clamp to map bounds
    if (mapX < 0 || mapX > vw || mapY < 0 || mapY > vh) return;

    if (mode === 'select') {
      // Check if tap is near a marker
      const HIT_RADIUS = 20;
      const hitMarker = markers.find((m) => {
        const dx = (m.x ?? 0) - mapX;
        const dy = (m.y ?? 0) - mapY;
        return dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS;
      });
      if (hitMarker) {
        onMarkerSelect(hitMarker);
        return;
      }

      const hitComment = comments.find((c) => {
        const dx = (c.x ?? 0) - mapX;
        const dy = (c.y ?? 0) - mapY;
        return dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS;
      });
      if (hitComment) {
        onCommentSelect(hitComment);
        return;
      }

      const hitPath = findNearestPath(paths, mapX, mapY, 15);
      if (hitPath) {
        onPathSelect(hitPath);
        return;
      }

      const hitItem = listItems.find((i) => {
        const dx = (i.x ?? 0) - mapX;
        const dy = (i.y ?? 0) - mapY;
        return dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS;
      });
      if (hitItem) {
        onListItemSelect(hitItem);
        return;
      }

      // Deselect all
      onMarkerSelect(null);
      onCommentSelect(null);
      onPathSelect(null);
      onListItemSelect(null);
    } else if (mode === 'add-comment' || mode === 'add-list-item') {
      onMapClick?.(Math.round(mapX), Math.round(mapY));
    }
  }, [
    containerWidth, containerHeight, scale, translateX, translateY,
    vw, vh, mode, markers, comments, paths, listItems,
    onMarkerSelect, onCommentSelect, onPathSelect, onListItemSelect, onMapClick,
  ]);

  // ── Gestures ────────────────────────────────────────────────────────

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      runOnJS(handleTap)(e.x, e.y);
    });

  // For draw-path mode, use single-finger pan
  const drawPanGesture = Gesture.Pan()
    .maxPointers(1)
    .minDistance(5)
    .enabled(mode === 'draw-path')
    .onStart((e) => {
      runOnJS(handleDrawStart)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(handleDrawUpdate)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(handleDrawEnd)();
    });

  const handleDrawStart = useCallback((absX: number, absY: number) => {
    const pt = screenToMap(absX, absY);
    if (pt) onPathDraw?.([pt]); // Initial single point signals start
  }, [onPathDraw, containerWidth, containerHeight, scale, translateX, translateY, vw, vh]);

  const handleDrawUpdate = useCallback((absX: number, absY: number) => {
    const pt = screenToMap(absX, absY);
    if (pt) {
      // This is called on the JS thread - parent handles accumulating points
      onMapClick?.(pt.x, pt.y);
    }
  }, [onMapClick, containerWidth, containerHeight, scale, translateX, translateY, vw, vh]);

  const handleDrawEnd = useCallback(() => {
    // Signal end of drawing - parent handles saving
    onPathDraw?.([]); // Empty array signals end
  }, [onPathDraw]);

  // Helper to convert screen coords to map coords
  const screenToMap = useCallback((absX: number, absY: number): { x: number; y: number } | null => {
    const cw = containerWidth.value;
    const ch = containerHeight.value;
    if (cw === 0 || ch === 0) return null;

    const containerAspect = cw / ch;
    const mapAspect = vw / vh;

    let renderedW: number;
    let renderedH: number;
    let offsetX: number;
    let offsetY: number;

    if (containerAspect > mapAspect) {
      renderedH = ch;
      renderedW = ch * mapAspect;
      offsetX = (cw - renderedW) / 2;
      offsetY = 0;
    } else {
      renderedW = cw;
      renderedH = cw / mapAspect;
      offsetX = 0;
      offsetY = (ch - renderedH) / 2;
    }

    const s = scale.value;
    const tx = translateX.value;
    const ty = translateY.value;

    const mapX = ((absX - tx) / s - offsetX) / renderedW * vw;
    const mapY = ((absY - ty) / s - offsetY) / renderedH * vh;

    if (mapX < 0 || mapX > vw || mapY < 0 || mapY > vh) return null;
    return { x: Math.round(mapX), y: Math.round(mapY) };
  }, [containerWidth, containerHeight, scale, translateX, translateY, vw, vh]);

  // Compose gestures
  const zoomPan = Gesture.Simultaneous(pinchGesture, panGesture);
  const composed = mode === 'draw-path'
    ? Gesture.Race(zoomPan, drawPanGesture)
    : Gesture.Race(zoomPan, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Drawing preview points string
  const drawingPointsStr = drawingPoints.map((p) => `${p.x},${p.y}`).join(' ');

  if (!resolvedUri && fileType === 'image') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.svgContainer, animatedStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${vw} ${vh}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Layer 1: Map image */}
            {resolvedUri && (
              <SvgImage
                href={resolvedUri}
                x={0}
                y={0}
                width={vw}
                height={vh}
                preserveAspectRatio="xMidYMid meet"
              />
            )}

            {/* Layer 2: Paths */}
            <PathOverlaySvg paths={paths} selectedPathId={selectedPathId} />

            {/* Live drawing preview */}
            {isDrawing && drawingPoints.length > 1 && (
              <Polyline
                points={drawingPointsStr}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            )}

            {/* Layer 3: List items */}
            <G>
              {listItems.map((item) => (
                <ListItemPinSvg
                  key={item.id}
                  item={item}
                  isSelected={selectedListItemId === item.id}
                />
              ))}
            </G>

            {/* Layer 4: Markers */}
            <G>
              {markers.map((marker) => (
                <MarkerDot
                  key={marker.id}
                  marker={marker}
                  keyDef={marker.key_id ? keyMap.get(marker.key_id) : undefined}
                  isSelected={selectedMarkerId === marker.id}
                />
              ))}
            </G>

            {/* Layer 5: Comments */}
            <G>
              {comments.map((comment) => (
                <CommentPinSvg
                  key={comment.id}
                  comment={comment}
                  isSelected={selectedCommentId === comment.id}
                />
              ))}
            </G>
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function findNearestPath(
  paths: MapPathRecord[],
  x: number,
  y: number,
  threshold: number,
): string | null {
  for (const p of paths) {
    let points: { x: number; y: number }[];
    try {
      points = JSON.parse(p.path_data ?? '[]');
    } catch {
      continue;
    }
    for (let i = 0; i < points.length - 1; i++) {
      const dist = pointToSegmentDist(x, y, points[i], points[i + 1]);
      if (dist < threshold) return p.id;
    }
  }
  return null;
}

function pointToSegmentDist(
  px: number,
  py: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - a.x, py - a.y);
  let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  svgContainer: {
    flex: 1,
  },
});
