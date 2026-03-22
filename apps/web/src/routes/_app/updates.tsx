import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { getRecentMarkers } from '#/server/db-queries'
import { MapPin } from 'lucide-react'

export const Route = createFileRoute('/_app/updates')({
  loader: () => getRecentMarkers(),
  component: Updates,
})

function Updates() {
  const markers = Route.useLoaderData()

  const active = markers.filter((m) => m.status === 'active')
  const flagged = markers.filter((m) => m.status === 'flagged')
  const resolved = markers.filter((m) => m.status === 'resolved')

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Updates</h1>
        <p className="text-sm text-gray-500">Recent marker updates from field technicians</p>
      </div>

      <div className="mb-6 flex gap-3">
        <Badge variant="default">{active.length} active</Badge>
        <Badge variant="destructive">{flagged.length} flagged</Badge>
        <Badge variant="secondary">{resolved.length} resolved</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Recent Updates</CardTitle>
          <CardDescription>Last 50 marker changes across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          {markers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="mb-3 h-10 w-10 text-gray-300" />
              <h3 className="text-sm font-medium text-gray-900">No updates yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                When technicians place or update markers in the mobile app, changes will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Map</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: marker.projectId }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {marker.projectName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{marker.mapName}</TableCell>
                    <TableCell>
                      <StatusBadge status={marker.status} />
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
