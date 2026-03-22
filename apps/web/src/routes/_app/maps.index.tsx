import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent } from '#/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Map, Building2, Plus } from 'lucide-react'
import { getMaps, getFacilities, getProjects } from '#/server/db-queries'
import {
  AddFacilityDialog,
  AddMapDialog,
  FacilityCards,
  FacilityMapsSheet,
  MapsTable,
  MapViewerModal,
  HomeFacilities,
  FavoriteMaps,
  PersonalMaps,
} from '#/components/maps'

export const Route = createFileRoute('/_app/maps/')({
  loader: async () => {
    const [maps, facilities, projects] = await Promise.all([getMaps(), getFacilities(), getProjects()])
    return { maps, facilities, projects }
  },
  component: Maps,
})

function Maps() {
  const { maps, facilities, projects } = Route.useLoaderData()
  const router = useRouter()
  const [selectedFacility, setSelectedFacility] = useState<{ id: string; name: string; address?: string | null } | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showAddFacility, setShowAddFacility] = useState(false)
  const [showAddMap, setShowAddMap] = useState(false)
  const [viewingMapId, setViewingMapId] = useState<string | null>(null)

  const hasFacilities = facilities.length > 0

  const mapCountByFacility = maps.reduce<Record<string, number>>((acc, m) => {
    if (m.facilityName) acc[m.facilityName] = (acc[m.facilityName] || 0) + 1
    return acc
  }, {})

  const facilityMaps = selectedFacility
    ? maps.filter((m) => m.facilityName === selectedFacility.name)
    : []

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maps</h1>
          <p className="text-sm text-muted-foreground">All uploaded floor plans and site maps</p>
        </div>
        <Button size="icon" onClick={() => setShowAddMenu(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Home facilities — TODO: pass user's assigned facilities */}
      <HomeFacilities facilities={[]} />

      {/* Favorites — TODO: wire up once DB supports it */}
      <FavoriteMaps />

      {/* Personal maps — TODO: wire up once DB supports it */}
      <PersonalMaps />

      <FacilityCards
        facilities={facilities}
        mapCountByFacility={mapCountByFacility}
        onSelect={setSelectedFacility}
      />

      {maps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Map className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-sm font-medium">No maps yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFacilities ? 'Upload your first map to get started.' : 'Add a facility to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <MapsTable maps={maps} onMapSelect={setViewingMapId} />
      )}

      {/* "What would you like to add?" chooser */}
      <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What would you like to add?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <button
              className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
              onClick={() => {
                setShowAddMenu(false)
                setShowAddFacility(true)
              }}
            >
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Facility</p>
                <p className="text-xs text-muted-foreground">A building, plant, or site</p>
              </div>
            </button>
            <button
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                hasFacilities ? 'hover:bg-accent' : 'opacity-40 cursor-not-allowed'
              }`}
              onClick={() => {
                if (!hasFacilities) return
                setShowAddMenu(false)
                setShowAddMap(true)
              }}
            >
              <Map className={`h-5 w-5 ${hasFacilities ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-semibold">Map</p>
                <p className="text-xs text-muted-foreground">
                  {hasFacilities ? 'A floor plan or site map' : 'Add a facility first'}
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AddFacilityDialog
        open={showAddFacility}
        onOpenChange={setShowAddFacility}
        onCreated={() => router.invalidate()}
      />

      <AddMapDialog
        open={showAddMap}
        onOpenChange={setShowAddMap}
        facilities={facilities}
        projects={projects}
        onCreated={() => router.invalidate()}
      />

      <FacilityMapsSheet
        facility={selectedFacility}
        maps={facilityMaps}
        onClose={() => setSelectedFacility(null)}
        onMapSelect={setViewingMapId}
      />

      <MapViewerModal
        mapId={viewingMapId}
        onClose={() => setViewingMapId(null)}
      />
    </div>
  )
}
