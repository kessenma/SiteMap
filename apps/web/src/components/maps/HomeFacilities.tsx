import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Building2 } from 'lucide-react'

// TODO: Wire up to real data — user's home/assigned facilities
// For now this is a placeholder showing the section layout

type Facility = { id: string; name: string; address?: string | null }

export function HomeFacilities({ facilities }: { facilities: Facility[] }) {
  const label = facilities.length === 1 ? 'Home Facility' : 'My Home Facilities'

  if (facilities.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">{label}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((f) => (
          <Card key={f.id} className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                {f.name}
              </CardTitle>
            </CardHeader>
            {f.address && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{f.address}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
