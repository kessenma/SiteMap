import { Card, CardContent } from '#/components/ui/card'
import { Star } from 'lucide-react'

// TODO: Wire up to real data — user's favorited/pinned maps
// For now this is a placeholder showing the section layout

export function FavoriteMaps() {
  // Replace with real favorites data once the DB schema is in place
  const favorites: any[] = []

  if (favorites.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Favorites</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Star className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Star maps to quickly access them here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Favorites</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* TODO: render favorite map cards */}
      </div>
    </div>
  )
}
