import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { getDashboardStats, getRecentMarkers } from '#/server/db-queries'
import { FolderOpen, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const [stats, recentMarkers] = await Promise.all([
      getDashboardStats(),
      getRecentMarkers(),
    ])
    return { stats, recentMarkers }
  },
  component: Dashboard,
})

function Dashboard() {
  const { stats, recentMarkers } = Route.useLoaderData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of all facility projects and recent updates</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Projects"
          value={stats.projects}
          icon={<FolderOpen className="h-4 w-4 text-blue-600" />}
          description="Total facilities"
        />
        <StatCard
          title="Total Markers"
          value={stats.totalMarkers}
          icon={<MapPin className="h-4 w-4 text-gray-600" />}
          description="All equipment pins"
        />
        <StatCard
          title="Active"
          value={stats.activeMarkers}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          description="Needs attention"
        />
        <StatCard
          title="Flagged"
          value={stats.flaggedMarkers}
          icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          description="Requires review"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>Latest marker activity from field technicians</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMarkers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {recentMarkers.map((marker) => (
                <MarkerRow key={marker.id} marker={marker} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, description }: {
  title: string
  value: number
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  )
}

function MarkerRow({ marker }: { marker: Awaited<ReturnType<typeof getRecentMarkers>>[number] }) {
  const statusColors = {
    active: 'default',
    resolved: 'secondary',
    flagged: 'destructive',
  } as const

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: marker.keyColor }}
        >
          {marker.keyLabel.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{marker.label || marker.keyLabel}</p>
          <p className="text-xs text-gray-500">
            {marker.projectName} &middot; {marker.mapName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusColors[marker.status]}>{marker.status}</Badge>
        <span className="text-xs text-gray-400">
          {new Date(marker.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="mb-3 h-10 w-10 text-gray-300" />
      <h3 className="text-sm font-medium text-gray-900">No updates yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Marker updates from your mobile app will appear here once technicians start logging.
      </p>
    </div>
  )
}
