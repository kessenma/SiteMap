import { useRef, useCallback, useState, memo } from 'react'
import { FileText } from 'lucide-react'
import { MARKER_SIZES } from './map-constants'
import type { MapMode } from './map-constants'
import { PathOverlay } from './PathOverlay'

// ── Types ─────────────────────────────────────────────────────────────

type MarkerKey = {
  id: string
  label: string
  iconColor: string
  iconShape: string
  iconType: string
  iconText: string | null
  iconName: string
  customIconUri: string | null
  markerSize: string
}

type Marker = {
  id: string
  keyId: string
  x: number
  y: number
  label: string
  description: string
  status: string
}

type MapComment = {
  id: string
  x: number
  y: number
  content: string
  resolvedAt: string | Date | null
}

type MapPath = {
  id: string
  label: string
  color: string
  strokeWidth: number
  pathData: string
}

type MapListItem = {
  id: string
  x: number
  y: number
  label: string
  sortOrder: number
  status: string
}

// ── Shape Paths ───────────────────────────────────────────────────────

const SHAPE_PATHS: Record<string, (size: number) => string> = {
  circle: () => '',
  square: (s) => `M${-s / 2},${-s / 2} h${s} v${s} h${-s}Z`,
  triangle: (s) => `M0,${-s / 2} L${s / 2},${s / 2} L${-s / 2},${s / 2}Z`,
  diamond: (s) => `M0,${-s / 2} L${s / 2},0 L0,${s / 2} L${-s / 2},0Z`,
}

const LIST_STATUS_COLORS: Record<string, string> = {
  pending: '#9CA3AF',
  in_progress: '#F59E0B',
  completed: '#10B981',
}

// ── MarkerDot ─────────────────────────────────────────────────────────

function MarkerDot({
  marker,
  keyDef,
  isSelected,
  onSelect,
}: {
  marker: Marker
  keyDef: MarkerKey | undefined
  isSelected: boolean
  onSelect: (marker: Marker) => void
}) {
  const color = keyDef?.iconColor ?? '#3B82F6'
  const shape = keyDef?.iconShape ?? 'circle'
  const iconType = keyDef?.iconType ?? 'shape'
  const sizeKey = (keyDef?.markerSize ?? 'md') as keyof typeof MARKER_SIZES
  const size = MARKER_SIZES[sizeKey] ?? 24
  const half = size / 2

  const strokeProps = {
    stroke: isSelected ? '#fff' : 'rgba(0,0,0,0.3)',
    strokeWidth: isSelected ? 3 : 1.5,
  }

  const renderIcon = () => {
    if (iconType === 'image' || iconType === 'drawn') {
      const uri = keyDef?.customIconUri
      if (uri) {
        const src = `/api/files?path=${encodeURIComponent(uri)}`
        return (
          <>
            <circle r={half} fill="#fff" {...strokeProps} />
            <image
              href={src}
              x={-half + 2}
              y={-half + 2}
              width={size - 4}
              height={size - 4}
              clipPath={`circle(${half - 2}px)`}
            />
          </>
        )
      }
    }

    if (iconType === 'text') {
      const txt = keyDef?.iconText ?? '?'
      return (
        <>
          <circle r={half} fill={color} {...strokeProps} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize={size * 0.5}
            fontFamily="system-ui, sans-serif"
            fontWeight="700"
          >
            {txt.slice(0, 2)}
          </text>
        </>
      )
    }

    // Default: shape
    if (shape === 'circle') {
      return <circle r={half} fill={color} {...strokeProps} />
    }
    return (
      <path
        d={SHAPE_PATHS[shape]?.(size) ?? SHAPE_PATHS.circle(size)}
        fill={color}
        {...strokeProps}
      />
    )
  }

  return (
    <g
      transform={`translate(${marker.x}, ${marker.y})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(marker)
      }}
      className="cursor-pointer"
    >
      {renderIcon()}
      {isSelected && marker.label && (
        <g transform={`translate(0, ${-half - 8})`}>
          <rect x={-40} y={-14} width={80} height={20} rx={4} fill="rgba(0,0,0,0.75)" />
          <text
            textAnchor="middle"
            y={0}
            fill="#fff"
            fontSize={11}
            fontFamily="system-ui, sans-serif"
          >
            {marker.label.length > 12 ? marker.label.slice(0, 12) + '…' : marker.label}
          </text>
        </g>
      )}
    </g>
  )
}

// ── CommentPin ────────────────────────────────────────────────────────

function CommentPin({
  comment,
  isSelected,
  onSelect,
  pingKey,
}: {
  comment: MapComment
  isSelected: boolean
  onSelect: (comment: MapComment) => void
  pingKey?: number
}) {
  const isResolved = !!comment.resolvedAt
  const s = 1.8 // scale factor
  return (
    <g
      transform={`translate(${comment.x}, ${comment.y}) scale(${s})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(comment)
      }}
      className="cursor-pointer"
      opacity={isResolved ? 0.5 : 1}
    >
      {/* Ping ring on selection */}
      {isSelected && (
        <circle
          key={pingKey}
          cy={-6}
          r={6}
          fill="none"
          stroke="#3B82F6"
          className="comment-ping-ring"
        />
      )}
      {/* Drop shadow */}
      <path
        d="M0,-16 C-8,-16 -12,-10 -12,-6 C-12,2 0,12 0,12 C0,12 12,2 12,-6 C12,-10 8,-16 0,-16Z"
        fill="rgba(0,0,0,0.2)"
        transform="translate(1,1)"
      />
      {/* Pin shape */}
      <path
        d="M0,-16 C-8,-16 -12,-10 -12,-6 C-12,2 0,12 0,12 C0,12 12,2 12,-6 C12,-10 8,-16 0,-16Z"
        fill={isSelected ? '#3B82F6' : '#6366F1'}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
        strokeWidth={isSelected ? 2 : 1}
      />
      {/* Inner circle */}
      <circle cy={-6} r={4} fill="#fff" />
      {isResolved && (
        <text
          textAnchor="middle"
          y={-3}
          fill="#10B981"
          fontSize={8}
          fontWeight="bold"
        >
          ✓
        </text>
      )}
    </g>
  )
}

// ── ListItemPin ───────────────────────────────────────────────────────

function ListItemPin({
  item,
  isSelected,
  onSelect,
}: {
  item: MapListItem
  isSelected: boolean
  onSelect: (item: MapListItem) => void
}) {
  const color = LIST_STATUS_COLORS[item.status] ?? '#9CA3AF'
  return (
    <g
      transform={`translate(${item.x}, ${item.y})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(item)
      }}
      className="cursor-pointer"
    >
      <circle
        r={10}
        fill={color}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
        strokeWidth={isSelected ? 3 : 1.5}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={10}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {item.sortOrder}
      </text>
    </g>
  )
}

// ── SVG Coordinate Helper ─────────────────────────────────────────────

function getSvgPoint(svg: SVGSVGElement, e: React.MouseEvent): { x: number; y: number } {
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const svgPt = pt.matrixTransform(ctm.inverse())
  return { x: Math.round(svgPt.x), y: Math.round(svgPt.y) }
}

// ── MapViewer ─────────────────────────────────────────────────────────

export const MapViewer = memo(function MapViewer({
  signedUrl,
  fileType,
  width,
  height,
  markers,
  keys,
  selectedMarkerId,
  onMarkerSelect,
  // Mode & interactions
  mode = 'select',
  onMapClick,
  // Comments
  comments = [],
  selectedCommentId,
  onCommentSelect,
  // Paths
  paths = [],
  selectedPathId,
  onPathSelect,
  onPathDraw,
  pendingPath,
  // List items
  listItems = [],
  selectedListItemId,
  onListItemSelect,
}: {
  signedUrl: string
  fileType: string
  width: number
  height: number
  markers: Marker[]
  keys: MarkerKey[]
  selectedMarkerId?: string | null
  onMarkerSelect?: (marker: Marker | null) => void
  mode?: MapMode
  onMapClick?: (x: number, y: number) => void
  comments?: MapComment[]
  selectedCommentId?: string | null
  onCommentSelect?: (comment: MapComment | null) => void
  paths?: MapPath[]
  selectedPathId?: string | null
  onPathSelect?: (pathId: string | null) => void
  onPathDraw?: (points: { x: number; y: number }[]) => void
  pendingPath?: { points: { x: number; y: number }[]; color: string; strokeWidth: number } | null
  listItems?: MapListItem[]
  selectedListItemId?: string | null
  onListItemSelect?: (item: MapListItem | null) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const keyMap = new Map(keys.map((k) => [k.id, k]))

  // Animation keys — increment to replay CSS animations on re-selection
  const commentPingRef = useRef(0)
  const pathFlashRef = useRef(0)
  const prevCommentId = useRef(selectedCommentId)
  const prevPathId = useRef(selectedPathId)

  if (selectedCommentId && selectedCommentId !== prevCommentId.current) {
    commentPingRef.current++
  }
  prevCommentId.current = selectedCommentId

  if (selectedPathId && selectedPathId !== prevPathId.current) {
    pathFlashRef.current++
  }
  prevPathId.current = selectedPathId

  // Path drawing state
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode === 'select') {
        onMarkerSelect?.(null)
        onCommentSelect?.(null)
        onPathSelect?.(null)
        onListItemSelect?.(null)
        return
      }

      if (!svgRef.current) return
      const pt = getSvgPoint(svgRef.current, e)

      if (mode === 'add-comment' || mode === 'add-list-item') {
        onMapClick?.(pt.x, pt.y)
      }
    },
    [mode, onMarkerSelect, onCommentSelect, onPathSelect, onListItemSelect, onMapClick],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== 'draw-path' || !svgRef.current) return
      const pt = getSvgPoint(svgRef.current, e as unknown as React.MouseEvent)
      setDrawingPoints([pt])
      setIsDrawing(true)
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    },
    [mode],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing || !svgRef.current) return
      const pt = getSvgPoint(svgRef.current, e as unknown as React.MouseEvent)
      setDrawingPoints((prev) => {
        const last = prev[prev.length - 1]
        if (last) {
          const dx = pt.x - last.x
          const dy = pt.y - last.y
          if (dx * dx + dy * dy < 9) return prev // skip if < 3px
        }
        return [...prev, pt]
      })
    },
    [isDrawing],
  )

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (drawingPoints.length >= 2) {
      onPathDraw?.(drawingPoints)
    }
    setDrawingPoints([])
  }, [isDrawing, drawingPoints, onPathDraw])

  if (fileType === 'pdf') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-5 w-5" />
          <span className="text-sm">PDF map</span>
        </div>
        <iframe
          src={signedUrl}
          title="Map PDF"
          className="h-[80vh] w-full rounded-lg border border-border"
        />
      </div>
    )
  }

  const vw = width || 1000
  const vh = height || 800
  const drawingPointsStr = drawingPoints.map((p) => `${p.x},${p.y}`).join(' ')

  const cursorClass =
    mode === 'add-comment' || mode === 'add-list-item'
      ? 'cursor-crosshair'
      : mode === 'draw-path'
        ? 'cursor-crosshair'
        : 'cursor-default'

  return (
    <div className="relative overflow-auto rounded-lg border border-border bg-muted/30">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vw} ${vh}`}
        className={`block max-h-[80vh] w-full ${cursorClass}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleBackgroundClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Layer 1: Map image */}
        <image href={signedUrl} x={0} y={0} width={vw} height={vh} />

        {/* Layer 2: Paths */}
        <PathOverlay
          paths={paths}
          selectedPathId={selectedPathId}
          onSelect={onPathSelect}
          flashKey={pathFlashRef.current}
        />

        {/* Pending path preview (shown while editing before save) */}
        {pendingPath && pendingPath.points.length > 1 && (
          <polyline
            points={pendingPath.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={pendingPath.color}
            strokeWidth={pendingPath.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
            className="pointer-events-none"
          />
        )}

        {/* Live drawing path */}
        {isDrawing && drawingPoints.length > 1 && (
          <polyline
            points={drawingPointsStr}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
            className="pointer-events-none"
          />
        )}

        {/* Layer 3: List items */}
        <g className="list-items-layer">
          {listItems.map((item) => (
            <ListItemPin
              key={item.id}
              item={item}
              isSelected={selectedListItemId === item.id}
              onSelect={(i) => onListItemSelect?.(i)}
            />
          ))}
        </g>

        {/* Layer 4: Markers */}
        <g className="markers-layer">
          {markers.map((marker) => (
            <MarkerDot
              key={marker.id}
              marker={marker}
              keyDef={keyMap.get(marker.keyId)}
              isSelected={selectedMarkerId === marker.id}
              onSelect={(m) => onMarkerSelect?.(m)}
            />
          ))}
        </g>

        {/* Layer 5: Comments */}
        <g className="comments-layer">
          {comments.map((comment) => (
            <CommentPin
              key={comment.id}
              comment={comment}
              isSelected={selectedCommentId === comment.id}
              onSelect={(c) => onCommentSelect?.(c)}
              pingKey={commentPingRef.current}
            />
          ))}
        </g>
      </svg>
    </div>
  )
})
