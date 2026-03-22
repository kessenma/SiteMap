import { MousePointer2, MessageCircle, Pencil, ListChecks } from 'lucide-react'
import { Button } from '#/components/ui/button'
import type { MapMode } from './map-constants'

const MODES: { value: MapMode; icon: typeof MousePointer2; label: string }[] = [
  { value: 'select', icon: MousePointer2, label: 'Select' },
  { value: 'add-comment', icon: MessageCircle, label: 'Comment' },
  { value: 'draw-path', icon: Pencil, label: 'Draw Path' },
  { value: 'add-list-item', icon: ListChecks, label: 'List Item' },
]

export function MapToolbar({
  mode,
  onModeChange,
}: {
  mode: MapMode
  onModeChange: (mode: MapMode) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      {MODES.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={mode === value ? 'default' : 'ghost'}
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={() => onModeChange(value)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}
    </div>
  )
}
