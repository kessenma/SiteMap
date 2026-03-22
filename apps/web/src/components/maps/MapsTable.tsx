import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Map, Building2, ArrowRight, FileText } from 'lucide-react'

type MapRow = {
  id: string
  name: string
  description: string | null
  fileType: string | null
  signedUrl?: string | null
  facilityName: string | null
  projectName: string | null
  projectId: string | null
  updatedAt: string | Date
}

export function MapsTable({
  maps,
  onMapSelect,
}: {
  maps: MapRow[]
  onMapSelect: (mapId: string) => void
}) {
  if (maps.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Maps</CardTitle>
        <CardDescription>
          {maps.length} map{maps.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maps.map((map) => (
              <TableRow
                key={map.id}
                className="cursor-pointer"
                onClick={() => onMapSelect(map.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    {map.signedUrl && map.fileType === 'image' ? (
                      <img
                        src={map.signedUrl}
                        alt={map.name}
                        className="h-10 w-10 rounded object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-muted">
                        {map.fileType === 'pdf' ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Map className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">{map.name}</span>
                      {map.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{map.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {map.facilityName ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{map.facilityName}</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {map.projectId ? (
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: map.projectId }}
                      className="text-sm text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {map.projectName}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(map.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
