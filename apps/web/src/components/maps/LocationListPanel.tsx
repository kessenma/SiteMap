import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { LIST_ITEM_STATUS_COLORS } from './map-constants'

type ListItemPhoto = {
  id: string
  fileUri: string
  fileName: string
  caption: string
}

type ListItem = {
  id: string
  x: number
  y: number
  label: string
  description: string
  sortOrder: number
  status: string
  completedBy: string | null
  completedAt: string | Date | null
  photos?: ListItemPhoto[]
}

type MapList = {
  id: string
  name: string
  description: string
  items: ListItem[]
}

export function LocationListPanel({
  lists,
  selectedListId,
  selectedItemId,
  onSelectList,
  onSelectItem,
  onCreateList,
  onUpdateItemStatus,
}: {
  lists: MapList[]
  selectedListId: string | null
  selectedItemId: string | null
  onSelectList: (listId: string | null) => void
  onSelectItem: (itemId: string | null) => void
  onCreateList: (name: string, description: string) => void
  onUpdateItemStatus: (itemId: string, status: string) => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreateList(newName.trim(), newDesc.trim())
    setNewName('')
    setNewDesc('')
    setCreating(false)
  }

  const nextStatus = (current: string) => {
    if (current === 'pending') return 'in_progress'
    if (current === 'in_progress') return 'completed'
    return 'pending'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold">Location Lists</h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setCreating(!creating)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {creating && (
        <div className="space-y-1.5 rounded-lg border border-border p-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="List name..."
            className="h-7 text-xs"
          />
          <Input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="h-7 text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-6 text-xs" onClick={handleCreate}>
              Create
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {lists.map((list) => {
        const isExpanded = selectedListId === list.id
        const completed = list.items.filter((i) => i.status === 'completed').length
        const total = list.items.length
        const progressPct = total > 0 ? (completed / total) * 100 : 0

        return (
          <div key={list.id} className="rounded-lg border border-border">
            <button
              type="button"
              className="flex w-full items-center gap-2 p-2 text-left hover:bg-muted/50"
              onClick={() => onSelectList(isExpanded ? null : list.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="text-xs font-medium flex-1 truncate">{list.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {completed}/{total}
              </span>
            </button>

            {/* Progress bar */}
            {total > 0 && (
              <div className="mx-2 mb-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: progressPct === 100 ? '#10B981' : '#3B82F6',
                  }}
                />
              </div>
            )}

            {isExpanded && (
              <div className="border-t border-border p-1.5 space-y-1">
                {list.items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No items yet. Use "List Item" mode to add locations on the map.
                  </p>
                )}
                {list.items
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded p-1.5 text-left hover:bg-muted/50"
                      style={{
                        backgroundColor: selectedItemId === item.id ? '#F0F9FF' : undefined,
                      }}
                      onClick={() => onSelectItem(selectedItemId === item.id ? null : item.id)}
                    >
                      <span
                        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: LIST_ITEM_STATUS_COLORS[item.status] ?? '#9CA3AF' }}
                      >
                        {item.sortOrder}
                      </span>
                      <span className="text-xs flex-1 truncate">{item.label || `Item ${item.sortOrder}`}</span>
                      <button
                        type="button"
                        className="text-xs px-1.5 py-0.5 rounded border hover:bg-muted shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateItemStatus(item.id, nextStatus(item.status))
                        }}
                      >
                        <Badge
                          variant={item.status === 'completed' ? 'secondary' : item.status === 'in_progress' ? 'default' : 'outline'}
                          className="text-[10px] h-4"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </button>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )
      })}

      {lists.length === 0 && !creating && (
        <p className="text-xs text-muted-foreground">No location lists yet.</p>
      )}
    </div>
  )
}
