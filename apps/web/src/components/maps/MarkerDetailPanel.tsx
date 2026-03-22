import { Badge } from '#/components/ui/badge'

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
  createdAt: string | Date
  updatedAt: string | Date
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  resolved: 'secondary',
  flagged: 'destructive',
}

export function MarkerDetailPanel({
  marker,
  keyDef,
}: {
  marker: Marker
  keyDef: MarkerKey | undefined
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{marker.label || 'Untitled marker'}</h3>
        <Badge variant={STATUS_VARIANT[marker.status] ?? 'outline'}>
          {marker.status}
        </Badge>
      </div>
      {keyDef && (
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: keyDef.iconColor }}
          />
          <span className="text-xs text-muted-foreground">{keyDef.label}</span>
        </div>
      )}
      {marker.description && (
        <p className="mt-2 text-sm text-muted-foreground">{marker.description}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Updated {new Date(marker.updatedAt).toLocaleDateString()}
      </p>
    </div>
  )
}
