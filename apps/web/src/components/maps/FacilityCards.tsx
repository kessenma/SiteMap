import { Building2 } from 'lucide-react'

type Facility = { id: string; name: string; address?: string | null }

export function FacilityCards({
  facilities,
  mapCountByFacility,
  onSelect,
}: {
  facilities: Facility[]
  mapCountByFacility: Record<string, number>
  onSelect: (facility: Facility) => void
}) {
  if (facilities.length === 0) return null

  return (
    <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
      {facilities.map((facility) => {
        const count = mapCountByFacility[facility.name] ?? 0
        return (
          <button
            key={facility.id}
            onClick={() => onSelect(facility)}
            className="flex min-w-[140px] flex-col rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold truncate">{facility.name}</span>
            </div>
            {facility.address && (
              <p className="mt-1 text-xs text-muted-foreground truncate">{facility.address}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              {count} map{count !== 1 ? 's' : ''}
            </p>
          </button>
        )
      })}
    </div>
  )
}
