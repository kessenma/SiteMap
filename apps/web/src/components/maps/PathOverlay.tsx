type MapPath = {
  id: string
  label: string
  color: string
  strokeWidth: number
  pathData: string
}

export function PathOverlay({
  paths,
  selectedPathId,
  onSelect,
  flashKey,
}: {
  paths: MapPath[]
  selectedPathId?: string | null
  onSelect?: (pathId: string | null) => void
  flashKey?: number
}) {
  return (
    <g className="paths-layer">
      {paths.map((path) => {
        let points: { x: number; y: number }[]
        try {
          points = JSON.parse(path.pathData)
        } catch {
          return null
        }
        if (points.length < 2) return null

        const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ')
        const isSelected = selectedPathId === path.id

        // Midpoint for label
        const mid = points[Math.floor(points.length / 2)]

        return (
          <g key={path.id}>
            {/* Hit area - wider invisible line for easier clicking */}
            <polyline
              points={pointsStr}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(path.strokeWidth * 3, 12)}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(path.id)
              }}
            />
            {/* Flash glow on selection */}
            {isSelected && (
              <polyline
                key={flashKey}
                points={pointsStr}
                fill="none"
                stroke={path.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="path-flash-line pointer-events-none"
                style={{ '--flash-width': `${path.strokeWidth + 12}px` } as React.CSSProperties}
              />
            )}
            {/* Selection outline */}
            {isSelected && (
              <polyline
                points={pointsStr}
                fill="none"
                stroke="#fff"
                strokeWidth={path.strokeWidth + 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
                className="pointer-events-none"
              />
            )}
            {/* Visible line */}
            <polyline
              points={pointsStr}
              fill="none"
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isSelected ? 1 : 0.7}
              className="pointer-events-none"
            />
            {/* Label */}
            {path.label && mid && (
              <text
                x={mid.x}
                y={mid.y - 8}
                textAnchor="middle"
                fill={path.color}
                fontSize={11}
                fontFamily="system-ui, sans-serif"
                fontWeight="600"
                className="pointer-events-none"
              >
                {path.label}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}
