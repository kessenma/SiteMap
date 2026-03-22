import { useRef, useCallback } from 'react'
import { FileText } from 'lucide-react'

type MarkerKey = {
  id: string
  label: string
  iconColor: string
  iconShape: string
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

const SHAPE_PATHS: Record<string, (size: number) => string> = {
  circle: () => '',
  square: (s) => `M${-s / 2},${-s / 2} h${s} v${s} h${-s}Z`,
  triangle: (s) => `M0,${-s / 2} L${s / 2},${s / 2} L${-s / 2},${s / 2}Z`,
  diamond: (s) => `M0,${-s / 2} L${s / 2},0 L0,${s / 2} L${-s / 2},0Z`,
}

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
  const size = 20

  return (
    <g
      transform={`translate(${marker.x}, ${marker.y})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(marker)
      }}
      className="cursor-pointer"
    >
      {shape === 'circle' ? (
        <circle
          r={size / 2}
          fill={color}
          stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
          strokeWidth={isSelected ? 3 : 1.5}
        />
      ) : (
        <path
          d={SHAPE_PATHS[shape]?.(size) ?? SHAPE_PATHS.circle(size)}
          fill={color}
          stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
          strokeWidth={isSelected ? 3 : 1.5}
        />
      )}
      {isSelected && marker.label && (
        <g transform={`translate(0, ${-size / 2 - 8})`}>
          <rect
            x={-40}
            y={-14}
            width={80}
            height={20}
            rx={4}
            fill="rgba(0,0,0,0.75)"
          />
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

export function MapViewer({
  signedUrl,
  fileType,
  width,
  height,
  markers,
  keys,
  selectedMarkerId,
  onMarkerSelect,
}: {
  signedUrl: string
  fileType: string
  width: number
  height: number
  markers: Marker[]
  keys: MarkerKey[]
  selectedMarkerId?: string | null
  onMarkerSelect?: (marker: Marker | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const keyMap = new Map(keys.map((k) => [k.id, k]))

  const handleBackgroundClick = useCallback(() => {
    onMarkerSelect?.(null)
  }, [onMarkerSelect])

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

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto rounded-lg border border-border bg-muted/30"
    >
      <svg
        viewBox={`0 0 ${width || 1000} ${height || 800}`}
        className="block max-h-[80vh] w-full"
        preserveAspectRatio="xMidYMid meet"
        onClick={handleBackgroundClick}
      >
        <image
          href={signedUrl}
          x={0}
          y={0}
          width={width || 1000}
          height={height || 800}
        />
        {markers.map((marker) => (
          <MarkerDot
            key={marker.id}
            marker={marker}
            keyDef={keyMap.get(marker.keyId)}
            isSelected={selectedMarkerId === marker.id}
            onSelect={(m) => onMarkerSelect?.(m)}
          />
        ))}
      </svg>
    </div>
  )
}
