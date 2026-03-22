import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '#/components/ui/sheet'
import { Map, ArrowRight, FileText, MapPin } from 'lucide-react'

type MapRow = {
  id: string
  name: string
  description: string | null
  fileType: string | null
  signedUrl?: string | null
  projectId: string | null
  updatedAt: string | Date
}

type Facility = { id: string; name: string; address?: string | null }

export function FacilityMapsSheet({
  facility,
  maps,
  onClose,
  onMapSelect,
}: {
  facility: Facility | null
  maps: MapRow[]
  onClose: () => void
  onMapSelect: (mapId: string) => void
}) {
  return (
    <Sheet open={!!facility} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{facility?.name}</SheetTitle>
          {facility?.address && (
            <SheetDescription>{facility.address}</SheetDescription>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {maps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No maps for this facility</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {maps.map((map) => (
                <button
                  key={map.id}
                  onClick={() => { onClose(); onMapSelect(map.id) }}
                  className="group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent w-full"
                >
                  {map.signedUrl && map.fileType === 'image' ? (
                    <img
                      src={map.signedUrl}
                      alt={map.name}
                      className="h-10 w-10 rounded object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-muted shrink-0">
                      {map.fileType === 'pdf' ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Map className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{map.name}</p>
                    {map.description && (
                      <p className="text-xs text-muted-foreground truncate">{map.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Updated {new Date(map.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
