type KeyDef = {
  iconType: string
  iconShape: string
  iconColor: string
  iconText: string | null
  iconName: string
  customIconUri: string | null
  markerSize: string
}

const SHAPE_PATHS: Record<string, (s: number) => string> = {
  square: (s) => `M${-s / 2},${-s / 2} h${s} v${s} h${-s}Z`,
  triangle: (s) => `M0,${-s / 2} L${s / 2},${s / 2} L${-s / 2},${s / 2}Z`,
  diamond: (s) => `M0,${-s / 2} L${s / 2},0 L0,${s / 2} L${-s / 2},0Z`,
}

export function KeyIconPreview({
  keyDef,
  size: overrideSize,
}: {
  keyDef: KeyDef
  size?: number
}) {
  const sz = overrideSize ?? 16
  const half = sz / 2

  if (keyDef.iconType === 'image' || keyDef.iconType === 'drawn') {
    if (keyDef.customIconUri) {
      const src = `/api/files?path=${encodeURIComponent(keyDef.customIconUri)}`
      return (
        <img
          src={src}
          alt=""
          className="shrink-0 rounded-sm object-cover"
          style={{ width: sz, height: sz }}
        />
      )
    }
    return (
      <span
        className="inline-block shrink-0 rounded-full"
        style={{ width: sz, height: sz, backgroundColor: keyDef.iconColor }}
      />
    )
  }

  if (keyDef.iconType === 'text') {
    return (
      <span
        className="inline-flex items-center justify-center shrink-0 rounded-full text-white font-bold"
        style={{
          width: sz,
          height: sz,
          backgroundColor: keyDef.iconColor,
          fontSize: sz * 0.55,
          lineHeight: 1,
        }}
      >
        {keyDef.iconText?.slice(0, 2) ?? '?'}
      </span>
    )
  }

  // Default: shape
  return (
    <svg width={sz} height={sz} viewBox={`${-half} ${-half} ${sz} ${sz}`}>
      {keyDef.iconShape === 'circle' ? (
        <circle r={half * 0.8} fill={keyDef.iconColor} />
      ) : (
        <path
          d={SHAPE_PATHS[keyDef.iconShape]?.(sz * 0.8) ?? ''}
          fill={keyDef.iconColor}
        />
      )}
    </svg>
  )
}
