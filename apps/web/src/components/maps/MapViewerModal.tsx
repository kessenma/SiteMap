import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import { getMap } from '#/server/db-queries'
import { MapViewer } from './MapViewer'
import { MarkerDetailPanel } from './MarkerDetailPanel'

type MapDetail = Awaited<ReturnType<typeof getMap>>

export function MapViewerModal({
  mapId,
  onClose,
}: {
  mapId: string | null
  onClose: () => void
}) {
  const [map, setMap] = useState<MapDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)

  useEffect(() => {
    if (!mapId) {
      setMap(null)
      setSelectedMarkerId(null)
      return
    }

    setLoading(true)
    setSelectedMarkerId(null)
    getMap({ data: { mapId } })
      .then(setMap)
      .catch((err) => {
        console.error('Failed to load map:', err)
        setMap(null)
      })
      .finally(() => setLoading(false))
  }, [mapId])

  const keyMap = map ? new Map(map.keys.map((k) => [k.id, k])) : new Map()
  const selectedMarker = map?.markers.find((m) => m.id === selectedMarkerId) ?? null

  return (
    <Dialog
      open={!!mapId}
      onOpenChange={(open) => { if (!open) onClose() }}
    >
      <DialogContent
        className="sm:max-w-[90vw] h-[85vh] flex flex-col"
        showCloseButton
      >
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && map && (
          <>
            {/* Header */}
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle>{map.name}</DialogTitle>
                  <DialogDescription>
                    <span className="flex items-center gap-3">
                      {map.facilityName && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {map.facilityName}
                        </span>
                      )}
                      {map.projectName && (
                        <span>{map.projectName}</span>
                      )}
                      {map.description && (
                        <span className="truncate">{map.description}</span>
                      )}
                    </span>
                  </DialogDescription>
                </div>
                <Link to="/maps/$mapId" params={{ mapId: map.id }}>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open page
                  </Button>
                </Link>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
              {/* Map */}
              <div className="flex-1 overflow-auto">
                {map.signedUrl ? (
                  <MapViewer
                    signedUrl={map.signedUrl}
                    fileType={map.fileType}
                    width={map.width}
                    height={map.height}
                    markers={map.markers}
                    keys={map.keys}
                    selectedMarkerId={selectedMarkerId}
                    onMarkerSelect={(m) => setSelectedMarkerId(m?.id ?? null)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No file uploaded for this map.
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-60 shrink-0 overflow-y-auto">
                {map.keys.length > 0 && (
                  <Card className="mb-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Legend</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-1.5">
                      {map.keys.map((key) => {
                        const markerCount = map.markers.filter((m) => m.keyId === key.id).length
                        return (
                          <div key={key.id} className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: key.iconColor }}
                            />
                            <span className="text-xs truncate">{key.label}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{markerCount}</span>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}

                {selectedMarker ? (
                  <MarkerDetailPanel
                    marker={selectedMarker}
                    keyDef={keyMap.get(selectedMarker.keyId)}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {map.markers.length > 0
                      ? 'Click a marker to see details.'
                      : 'No markers on this map yet.'}
                  </p>
                )}

                <p className="mt-3 text-xs text-muted-foreground">
                  {map.markers.length} marker{map.markers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </>
        )}

        {!loading && !map && mapId && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Map not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
