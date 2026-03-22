import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { ImagePlus } from 'lucide-react'
import { LIST_ITEM_STATUS_COLORS } from './map-constants'

type ListItemPhoto = {
  id: string
  fileUri: string
  fileName: string
  caption: string
}

type ListItem = {
  id: string
  label: string
  description: string
  sortOrder: number
  status: string
  completedBy: string | null
  completedAt: string | Date | null
  photos?: ListItemPhoto[]
}

export function ListItemDetail({
  item,
  onUpdateStatus,
  onAddPhoto,
}: {
  item: ListItem
  onUpdateStatus: (itemId: string, status: string) => void
  onAddPhoto: (itemId: string, file: File) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: LIST_ITEM_STATUS_COLORS[item.status] ?? '#9CA3AF' }}
          >
            {item.sortOrder}
          </span>
          <h3 className="text-sm font-semibold truncate">{item.label || `Item ${item.sortOrder}`}</h3>
        </div>
      </div>

      <Select
        value={item.status}
        onValueChange={(v) => { if (v) onUpdateStatus(item.id, v) }}
      >
        <SelectTrigger className="h-7 text-xs w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}

      {item.completedAt != null && (
        <p className="text-xs text-muted-foreground">
          Completed {new Date(item.completedAt as string | Date).toLocaleDateString()}
        </p>
      )}

      {/* Photos */}
      {item.photos && item.photos.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium">Photos</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {item.photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={`/api/files?path=${encodeURIComponent(photo.fileUri)}`}
                  alt={photo.caption || photo.fileName}
                  className="w-full aspect-square rounded border border-border object-cover"
                />
                {photo.caption && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="cursor-pointer block">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onAddPhoto(item.id, file)
          }}
        />
        <span className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer w-full">
          <ImagePlus className="h-3 w-3" /> Add Photo
        </span>
      </label>
    </div>
  )
}
