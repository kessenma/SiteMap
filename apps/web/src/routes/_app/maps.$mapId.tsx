import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { ArrowLeft, Building2 } from 'lucide-react'
import { getMap } from '#/server/db-queries'
import { MapViewer } from '#/components/maps/MapViewer'
import { MarkerDetailPanel } from '#/components/maps/MarkerDetailPanel'

export const Route = createFileRoute('/_app/maps/$mapId')({
  loader: async ({ params }) => {
    return getMap({ data: { mapId: params.mapId } })
  },
  component: MapDetail,
})

function MapDetail() {
  const map = Route.useLoaderData()
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)

  const keyMap = new Map(map.keys.map((k) => [k.id, k]))
  const selectedMarker = map.markers.find((m) => m.id === selectedMarkerId) ?? null

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/maps" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate">{map.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {map.facilityName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {map.facilityName}
              </span>
            )}
            {map.projectName && (
              <Link
                to="/projects/$projectId"
                params={{ projectId: map.projectId! }}
                className="text-blue-600 hover:underline"
              >
                {map.projectName}
              </Link>
            )}
            {map.description && (
              <span className="truncate">{map.description}</span>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {map.markers.length} marker{map.markers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map viewer */}
        <div className="flex-1 overflow-auto p-4">
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

        {/* Sidebar: legend + selected marker */}
        <div className="w-72 shrink-0 overflow-y-auto border-l border-border p-4">
          {/* Legend */}
          {map.keys.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {map.keys.map((key) => {
                  const markerCount = map.markers.filter((m) => m.keyId === key.id).length
                  return (
                    <div key={key.id} className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: key.iconColor }}
                      />
                      <span className="text-sm truncate">{key.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{markerCount}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Selected marker detail */}
          {selectedMarker ? (
            <MarkerDetailPanel
              marker={selectedMarker}
              keyDef={keyMap.get(selectedMarker.keyId)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {map.markers.length > 0
                ? 'Click a marker to see details.'
                : 'No markers on this map yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
