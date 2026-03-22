import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { getProjects } from '#/server/db-queries'
import { FolderOpen, MapPin, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/projects')({
  loader: () => getProjects(),
  component: Projects,
})

function Projects() {
  const projects = Route.useLoaderData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500">All facility projects and their maps</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="mb-3 h-10 w-10 text-gray-300" />
            <h3 className="text-sm font-medium text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first project from the mobile app to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>{projects.length} facility project{projects.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Maps</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: project.id }}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{project.address || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <MapPin className="mr-1 h-3 w-3" />
                        {project.mapCount} map{project.mapCount !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: project.id }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
