import { useState, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import {
  getMap,
  createMapComment,
  createCommentReply,
  toggleCommentReaction,
  resolveComment,
  reopenComment,
  addCommentPhoto,
  createMapPath,
  updateMapPath,
  deleteMapPath,
  createMapList,
  createMapListItem,
  updateListItemStatus,
  addListItemPhoto,
} from '#/server/db-queries'
import { MapViewer } from './MapViewer'
import { MapToolbar } from './MapToolbar'
import { MarkerDetailPanel } from './MarkerDetailPanel'
import { KeyIconPreview } from './KeyIconPreview'
import { CommentThread } from './CommentThread'
import { PathDetailPanel } from './PathDetailPanel'
import { LocationListPanel } from './LocationListPanel'
import { ListItemDetail } from './ListItemDetail'
import type { MapMode } from './map-constants'
import { PATH_COLORS } from './map-constants'

type MapDetail = Awaited<ReturnType<typeof getMap>>

export function MapViewerModal({
  mapId,
  onClose,
}: {
  mapId: string | null
  onClose: () => void
}) {
  const [map, setMap] = useState<MapDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<MapMode>('select')
  const [sidebarTab, setSidebarTab] = useState('legend')

  // Selection state
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedListItemId, setSelectedListItemId] = useState<string | null>(null)

  // New comment dialog
  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null)
  const [commentText, setCommentText] = useState('')

  // New path dialog
  const [pendingPath, setPendingPath] = useState<{ x: number; y: number }[] | null>(null)
  const [pathLabel, setPathLabel] = useState('')
  const [pathColor, setPathColor] = useState('#3B82F6')

  // New list item dialog
  const [pendingListItem, setPendingListItem] = useState<{ x: number; y: number } | null>(null)
  const [listItemLabel, setListItemLabel] = useState('')
  const [listItemDesc, setListItemDesc] = useState('')

  const loadMap = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const result = await getMap({ data: { mapId: id } })
      setMap(result)
    } catch (err) {
      console.error('Failed to load map:', err)
      setMap(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!mapId) {
      setMap(null)
      setSelectedMarkerId(null)
      return
    }
    setSelectedMarkerId(null)
    setSelectedCommentId(null)
    setSelectedPathId(null)
    setSelectedListItemId(null)
    loadMap(mapId)
  }, [mapId, loadMap])

  const reload = () => { if (mapId) loadMap(mapId) }

  const keyMap = map ? new Map(map.keys.map((k) => [k.id, k])) : new Map()
  const selectedMarker = map?.markers.find((m) => m.id === selectedMarkerId) ?? null
  const selectedComment = map?.comments?.find((c) => c.id === selectedCommentId) ?? null
  const selectedPath = map?.paths?.find((p) => p.id === selectedPathId) ?? null

  // Flatten list items for map rendering
  const allListItems = map?.lists?.flatMap((l) =>
    l.items.map((item) => ({ ...item, listId: l.id })),
  ) ?? []
  const selectedListItem = allListItems.find((i) => i.id === selectedListItemId) ?? null

  // ── Handlers ──────────────────────────────────────────────────────

  const handleMapClick = (x: number, y: number) => {
    if (mode === 'add-comment') {
      setPendingComment({ x, y })
      setCommentText('')
    } else if (mode === 'add-list-item' && selectedListId) {
      setPendingListItem({ x, y })
      setListItemLabel('')
      setListItemDesc('')
    }
  }

  const handleSaveComment = async () => {
    if (!pendingComment || !commentText.trim() || !mapId) return
    await createMapComment({ data: { mapId, x: pendingComment.x, y: pendingComment.y, content: commentText.trim() } })
    setPendingComment(null)
    setCommentText('')
    reload()
    setSidebarTab('comments')
  }

  const handlePathDraw = (points: { x: number; y: number }[]) => {
    setPendingPath(points)
    setPathLabel('')
    setPathColor('#3B82F6')
  }

  const handleSavePath = async () => {
    if (!pendingPath || !mapId) return
    await createMapPath({
      data: {
        mapId,
        label: pathLabel,
        color: pathColor,
        strokeWidth: 2,
        pathData: JSON.stringify(pendingPath),
      },
    })
    setPendingPath(null)
    reload()
    setSidebarTab('paths')
  }

  const handleSaveListItem = async () => {
    if (!pendingListItem || !selectedListId) return
    const list = map?.lists?.find((l) => l.id === selectedListId)
    const nextOrder = (list?.items.length ?? 0) + 1
    await createMapListItem({
      data: {
        listId: selectedListId,
        x: pendingListItem.x,
        y: pendingListItem.y,
        label: listItemLabel || `Item ${nextOrder}`,
        description: listItemDesc,
        sortOrder: nextOrder,
      },
    })
    setPendingListItem(null)
    reload()
  }

  const handleCommentReply = async (commentId: string, content: string) => {
    await createCommentReply({ data: { commentId, content } })
    reload()
  }

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    await toggleCommentReaction({ data: { commentId, emoji } })
    reload()
  }

  const handleResolve = async (commentId: string) => {
    await resolveComment({ data: { commentId } })
    reload()
  }

  const handleReopen = async (commentId: string) => {
    await reopenComment({ data: { commentId } })
    reload()
  }

  const handleCommentPhoto = async (commentId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'comment-photos')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    await addCommentPhoto({ data: { commentId, fileUri: data.filePath, fileName: file.name, fileSize: file.size } })
    reload()
  }

  const handleUpdatePath = async (pathId: string, data: { label: string; color: string; strokeWidth: number }) => {
    await updateMapPath({ data: { pathId, ...data } })
    reload()
  }

  const handleDeletePath = async (pathId: string) => {
    await deleteMapPath({ data: { pathId } })
    setSelectedPathId(null)
    reload()
  }

  const handleCreateList = async (name: string, description: string) => {
    if (!mapId) return
    await createMapList({ data: { mapId, name, description } })
    reload()
  }

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    await updateListItemStatus({ data: { itemId, status } })
    reload()
  }

  const handleListItemPhoto = async (itemId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'list-photos')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    await addListItemPhoto({ data: { listItemId: itemId, fileUri: data.filePath, fileName: file.name, fileSize: file.size, caption: '' } })
    reload()
  }

  // Auto-switch sidebar tab on selection
  useEffect(() => {
    if (selectedMarkerId) setSidebarTab('details')
    else if (selectedCommentId) setSidebarTab('comments')
    else if (selectedPathId) setSidebarTab('paths')
    else if (selectedListItemId) setSidebarTab('lists')
  }, [selectedMarkerId, selectedCommentId, selectedPathId, selectedListItemId])

  return (
    <Dialog
      open={!!mapId}
      onOpenChange={(open) => { if (!open) onClose() }}
    >
      <DialogContent
        className="sm:max-w-[90vw] h-[85vh] flex flex-col"
        showCloseButton
      >
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && map && (
          <>
            {/* Header */}
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle>{map.name}</DialogTitle>
                  <DialogDescription>
                    <span className="flex items-center gap-3">
                      {map.facilityName && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {map.facilityName}
                        </span>
                      )}
                      {map.projectName && (
                        <span>{map.projectName}</span>
                      )}
                      {map.description && (
                        <span className="truncate">{map.description}</span>
                      )}
                    </span>
                  </DialogDescription>
                </div>
                <Link to="/maps/$mapId" params={{ mapId: map.id }}>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open page
                  </Button>
                </Link>
              </div>
            </DialogHeader>

            {/* Toolbar */}
            <MapToolbar mode={mode} onModeChange={setMode} />

            {/* Body */}
            <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
              {/* Map */}
              <div className="flex-1 overflow-auto relative">
                {map.signedUrl ? (
                  <MapViewer
                    signedUrl={map.signedUrl}
                    fileType={map.fileType}
                    width={map.width}
                    height={map.height}
                    markers={map.markers}
                    keys={map.keys}
                    selectedMarkerId={selectedMarkerId}
                    onMarkerSelect={(m) => {
                      setSelectedMarkerId(m?.id ?? null)
                      if (m) { setSelectedCommentId(null); setSelectedPathId(null); setSelectedListItemId(null) }
                    }}
                    mode={mode}
                    onMapClick={handleMapClick}
                    comments={map.comments ?? []}
                    selectedCommentId={selectedCommentId}
                    onCommentSelect={(c) => {
                      setSelectedCommentId(c?.id ?? null)
                      if (c) { setSelectedMarkerId(null); setSelectedPathId(null); setSelectedListItemId(null) }
                    }}
                    paths={map.paths ?? []}
                    selectedPathId={selectedPathId}
                    onPathSelect={(id) => {
                      setSelectedPathId(id)
                      if (id) { setSelectedMarkerId(null); setSelectedCommentId(null); setSelectedListItemId(null) }
                    }}
                    onPathDraw={handlePathDraw}
                    listItems={allListItems}
                    selectedListItemId={selectedListItemId}
                    onListItemSelect={(i) => {
                      setSelectedListItemId(i?.id ?? null)
                      if (i) { setSelectedMarkerId(null); setSelectedCommentId(null); setSelectedPathId(null) }
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No file uploaded for this map.
                  </div>
                )}

                {/* Floating dialog for new comment */}
                {pendingComment && (
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border bg-background p-3 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-2">New comment at ({pendingComment.x}, {pendingComment.y})</p>
                    <div className="flex gap-2">
                      <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveComment() }}
                      />
                      <Button size="sm" className="h-8" onClick={handleSaveComment}>Post</Button>
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setPendingComment(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Floating dialog for new path */}
                {pendingPath && (
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border bg-background p-3 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-2">Save drawn path ({pendingPath.length} points)</p>
                    <div className="flex gap-2 mb-2">
                      {PATH_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="h-5 w-5 rounded-full border-2 shrink-0"
                          style={{ backgroundColor: c, borderColor: c === pathColor ? '#000' : '#d1d5db' }}
                          onClick={() => setPathColor(c)}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={pathLabel}
                        onChange={(e) => setPathLabel(e.target.value)}
                        placeholder="Label (optional)"
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" className="h-8" onClick={handleSavePath}>Save</Button>
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setPendingPath(null)}>Discard</Button>
                    </div>
                  </div>
                )}

                {/* Floating dialog for new list item */}
                {pendingListItem && (
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border bg-background p-3 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-2">New list item at ({pendingListItem.x}, {pendingListItem.y})</p>
                    <div className="flex flex-col gap-2">
                      <Input
                        value={listItemLabel}
                        onChange={(e) => setListItemLabel(e.target.value)}
                        placeholder="Label..."
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Input
                        value={listItemDesc}
                        onChange={(e) => setListItemDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8" onClick={handleSaveListItem}>Add Item</Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => setPendingListItem(null)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-72 shrink-0 overflow-y-auto">
                <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
                  <TabsList className="w-full mb-2">
                    <TabsTrigger value="legend" className="flex-1 text-xs">Legend</TabsTrigger>
                    <TabsTrigger value="comments" className="flex-1 text-xs">
                      Comments{map.comments && map.comments.length > 0 ? ` (${map.comments.length})` : ''}
                    </TabsTrigger>
                    <TabsTrigger value="paths" className="flex-1 text-xs">Paths</TabsTrigger>
                    <TabsTrigger value="lists" className="flex-1 text-xs">Lists</TabsTrigger>
                    <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                  </TabsList>

                  {/* Legend tab */}
                  <TabsContent value="legend" className="mt-0">
                    {map.keys.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Legend</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-1.5">
                          {map.keys.map((key) => {
                            const markerCount = map.markers.filter((m) => m.keyId === key.id).length
                            return (
                              <div key={key.id} className="flex items-center gap-2">
                                <KeyIconPreview
                                  keyDef={{
                                    iconType: key.iconType ?? 'shape',
                                    iconShape: key.iconShape,
                                    iconColor: key.iconColor,
                                    iconText: key.iconText ?? null,
                                    iconName: key.iconName,
                                    customIconUri: key.customIconUri ?? null,
                                    markerSize: key.markerSize ?? 'md',
                                  }}
                                  size={14}
                                />
                                <span className="text-xs truncate">{key.label}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{markerCount}</span>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {map.markers.length} marker{map.markers.length !== 1 ? 's' : ''}
                    </p>
                  </TabsContent>

                  {/* Comments tab */}
                  <TabsContent value="comments" className="mt-0 space-y-2">
                    {selectedComment ? (
                      <CommentThread
                        comment={{
                          ...selectedComment,
                          replies: selectedComment.replies ?? [],
                          reactions: aggregateReactions(selectedComment.reactions ?? [], ''),
                          photos: selectedComment.photos ?? [],
                        }}
                        onReply={handleCommentReply}
                        onToggleReaction={handleToggleReaction}
                        onResolve={handleResolve}
                        onReopen={handleReopen}
                        onAddPhoto={handleCommentPhoto}
                      />
                    ) : (
                      <>
                        {(map.comments ?? []).length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No comments yet. Use "Comment" mode to pin comments on the map.
                          </p>
                        ) : (
                          (map.comments ?? []).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="flex w-full items-start gap-2 rounded-lg border border-border p-2 text-left hover:bg-muted/50"
                              onClick={() => setSelectedCommentId(c.id)}
                            >
                              <span className={`inline-block h-2 w-2 rounded-full mt-1.5 shrink-0 ${c.resolvedAt ? 'bg-green-500' : 'bg-indigo-500'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs truncate">{c.content}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                  {c.resolvedAt && ' · Resolved'}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Paths tab */}
                  <TabsContent value="paths" className="mt-0 space-y-2">
                    {selectedPath ? (
                      <PathDetailPanel
                        path={selectedPath}
                        onUpdate={handleUpdatePath}
                        onDelete={handleDeletePath}
                      />
                    ) : (
                      <>
                        {(map.paths ?? []).length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No paths yet. Use "Draw Path" mode to draw on the map.
                          </p>
                        ) : (
                          (map.paths ?? []).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left hover:bg-muted/50"
                              onClick={() => setSelectedPathId(p.id)}
                            >
                              <span
                                className="inline-block h-3 w-6 rounded-sm shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-xs truncate flex-1">{p.label || 'Untitled path'}</span>
                            </button>
                          ))
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Lists tab */}
                  <TabsContent value="lists" className="mt-0">
                    <LocationListPanel
                      lists={(map.lists ?? []).map((l) => ({
                        ...l,
                        items: l.items.map((i) => ({ ...i, photos: i.photos })),
                      }))}
                      selectedListId={selectedListId}
                      selectedItemId={selectedListItemId}
                      onSelectList={setSelectedListId}
                      onSelectItem={setSelectedListItemId}
                      onCreateList={handleCreateList}
                      onUpdateItemStatus={handleUpdateItemStatus}
                    />
                    {selectedListItem && (
                      <div className="mt-2">
                        <ListItemDetail
                          item={{
                            ...selectedListItem,
                            photos: selectedListItem.photos,
                          }}
                          onUpdateStatus={handleUpdateItemStatus}
                          onAddPhoto={handleListItemPhoto}
                        />
                      </div>
                    )}
                  </TabsContent>

                  {/* Details tab */}
                  <TabsContent value="details" className="mt-0">
                    {selectedMarker ? (
                      <MarkerDetailPanel
                        marker={selectedMarker}
                        keyDef={keyMap.get(selectedMarker.keyId)}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {map.markers.length > 0
                          ? 'Click a marker to see details.'
                          : 'No markers on this map yet.'}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}

        {!loading && !map && mapId && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Map not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Helper to aggregate reactions into counts
function aggregateReactions(
  reactions: { emoji: string; userId: string }[],
  currentUserId: string,
) {
  const map = new Map<string, { count: number; hasReacted: boolean }>()
  for (const r of reactions) {
    const existing = map.get(r.emoji) ?? { count: 0, hasReacted: false }
    existing.count++
    if (r.userId === currentUserId) existing.hasReacted = true
    map.set(r.emoji, existing)
  }
  return Array.from(map, ([emoji, { count, hasReacted }]) => ({ emoji, count, hasReacted }))
}
