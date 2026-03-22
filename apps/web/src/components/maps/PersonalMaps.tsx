import { Card, CardContent } from '#/components/ui/card'
import { Map } from 'lucide-react'

// TODO: Wire up to real data — maps uploaded by or assigned to the current user
// For now this is a placeholder showing the section layout

export function PersonalMaps() {
  // Replace with real personal maps data once the DB query is in place
  const personalMaps: any[] = []

  if (personalMaps.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">My Maps</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Map className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Maps you upload or are assigned to will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">My Maps</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* TODO: render personal map cards */}
      </div>
    </div>
  )
}
