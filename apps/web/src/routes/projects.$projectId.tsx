import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { getProject, getProjectMarkers } from '#/server/db-queries'
import { ArrowLeft, MapIcon, MapPin } from 'lucide-react'

export const Route = createFileRoute('/projects/$projectId')({
  loader: async ({ params }) => {
    const [project, markers] = await Promise.all([
      getProject({ data: params.projectId }),
      getProjectMarkers({ data: params.projectId }),
    ])
    return { project, markers }
  },
  component: ProjectDetail,
})

function ProjectDetail() {
  const { project, markers } = Route.useLoaderData()

  const statusCounts = {
    active: markers.filter((m) => m.status === 'active').length,
    flagged: markers.filter((m) => m.status === 'flagged').length,
    resolved: markers.filter((m) => m.status === 'resolved').length,
  }

  return (
    <div className="p-6">
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.address && <p className="text-sm text-gray-500">{project.address}</p>}
        {project.description && <p className="mt-1 text-sm text-gray-600">{project.description}</p>}
      </div>

      <div className="mb-6 flex gap-3">
        <Badge variant="outline">
          <MapIcon className="mr-1 h-3 w-3" />
          {project.maps.length} map{project.maps.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline">{markers.length} markers</Badge>
        {statusCounts.flagged > 0 && (
          <Badge variant="destructive">{statusCounts.flagged} flagged</Badge>
        )}
      </div>

      <Tabs defaultValue="markers">
        <TabsList>
          <TabsTrigger value="markers">Markers ({markers.length})</TabsTrigger>
          <TabsTrigger value="maps">Maps ({project.maps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="markers">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Markers</CardTitle>
              <CardDescription>All markers placed by field technicians</CardDescription>
            </CardHeader>
            <CardContent>
              {markers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="text-sm font-medium text-gray-900">No markers yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Markers will appear once technicians start pinning equipment on maps.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Map</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {markers.map((marker) => (
                      <TableRow key={marker.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: marker.keyColor }}
                            />
                            <span className="text-sm">{marker.keyLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{marker.label || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{marker.mapName}</TableCell>
                        <TableCell>
                          <StatusBadge status={marker.status} />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                          {marker.description || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(marker.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maps">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.maps.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <MapIcon className="mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="text-sm font-medium text-gray-900">No maps uploaded</h3>
                  <p className="mt-1 text-sm text-gray-500">Upload floor plans from the mobile app.</p>
                </CardContent>
              </Card>
            ) : (
              project.maps.map((map) => {
                const mapMarkerCount = markers.filter((m) => m.mapId === map.id).length
                return (
                  <Card key={map.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{map.name}</CardTitle>
                      <CardDescription>{map.description || map.fileName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Badge variant="outline">{map.fileType}</Badge>
                        <span>{mapMarkerCount} marker{mapMarkerCount !== 1 ? 's' : ''}</span>
                        {map.width > 0 && (
                          <span>{Math.round(map.width)} &times; {Math.round(map.height)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    active: 'default',
    resolved: 'secondary',
    flagged: 'destructive',
  } as const
  return <Badge variant={variants[status as keyof typeof variants] ?? 'outline'}>{status}</Badge>
}
