import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Trash2, Pencil } from 'lucide-react'
import { PATH_COLORS } from './map-constants'

type MapPath = {
  id: string
  label: string
  color: string
  strokeWidth: number
  createdAt: string | Date
}

export function PathDetailPanel({
  path,
  onUpdate,
  onDelete,
}: {
  path: MapPath
  onUpdate: (pathId: string, data: { label: string; color: string; strokeWidth: number }) => void
  onDelete: (pathId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(path.label)
  const [color, setColor] = useState(path.color)
  const [strokeWidth, setStrokeWidth] = useState(path.strokeWidth)

  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 space-y-3">
        <div>
          <Label className="text-xs">Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Color</Label>
          <div className="flex gap-1.5 mt-1">
            {PATH_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="h-5 w-5 rounded-full border-2 shrink-0"
                style={{
                  backgroundColor: c,
                  borderColor: c === color ? '#000' : '#d1d5db',
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Thickness</Label>
          <div className="flex gap-2 mt-1">
            {[1, 2, 4, 6].map((w) => (
              <button
                key={w}
                type="button"
                className="flex items-center justify-center h-6 w-10 rounded border text-xs"
                style={{ borderColor: w === strokeWidth ? '#3B82F6' : '#d1d5db' }}
                onClick={() => setStrokeWidth(w)}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onUpdate(path.id, { label, color, strokeWidth })
              setEditing(false)
            }}
          >
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block h-3 w-6 rounded-sm shrink-0"
            style={{ backgroundColor: path.color }}
          />
          <span className="text-sm font-medium truncate">
            {path.label || 'Untitled path'}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => onDelete(path.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {path.strokeWidth}px · {new Date(path.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}
