import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import { MapViewer } from './MapViewer'
import { MapToolbar } from './MapToolbar'
import { MarkerDetailPanel } from './MarkerDetailPanel'
import { KeyIconPreview } from './KeyIconPreview'
import { CommentThread } from './CommentThread'
import { PathDetailPanel } from './PathDetailPanel'
import { LocationListPanel } from './LocationListPanel'
import { ListItemDetail } from './ListItemDetail'
import type { MapMode } from './map-constants'
import { PATH_COLORS, PATH_WIDTHS, DEFAULT_PATH_WIDTH } from './map-constants'
import {
  useMapMeta,
  useMapComments,
  useMapPaths,
  useMapLists,
  useAllListItems,
  useAllListItemPhotos,
  useCommentReplies,
  useCommentReactions,
  useCommentPhotos,
  useMapActions,
} from '#/hooks/useMapData'

export function MapViewerModal({
  mapId,
  onClose,
}: {
  mapId: string | null
  onClose: () => void
}) {
  const [mode, setMode] = useState<MapMode>('select')
  const [sidebarTab, setSidebarTab] = useState('legend')

  // Selection state
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedListItemId, setSelectedListItemId] = useState<string | null>(null)

  // Drill-in state (first click highlights, second click expands detail)
  const [expandedComment, setExpandedComment] = useState<string | null>(null)
  const [expandedPath, setExpandedPath] = useState<string | null>(null)

  // Live preview overrides for path editing
  const [pathPreview, setPathPreview] = useState<{ color: string; strokeWidth: number } | null>(null)

  // New comment dialog
  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null)
  const [commentText, setCommentText] = useState('')

  // New path dialog
  const [pendingPath, setPendingPath] = useState<{ x: number; y: number }[] | null>(null)
  const [pathLabel, setPathLabel] = useState('')
  const [pathColor, setPathColor] = useState('#3B82F6')
  const [pathWidth, setPathWidth] = useState(DEFAULT_PATH_WIDTH)

  // New list item dialog
  const [pendingListItem, setPendingListItem] = useState<{ x: number; y: number } | null>(null)
  const [listItemLabel, setListItemLabel] = useState('')
  const [listItemDesc, setListItemDesc] = useState('')

  // ── TanStack DB: metadata + live collections ──

  const { meta, loading } = useMapMeta(mapId)
  const activeMapId = mapId ?? ''

  // Live queries (only active when mapId is set)
  const { data: commentsList } = useMapComments(activeMapId)
  const { data: pathsList } = useMapPaths(activeMapId)
  const { data: listsList } = useMapLists(activeMapId)
  const { data: allItemsList } = useAllListItems(activeMapId)
  const { data: allItemPhotosList } = useAllListItemPhotos(activeMapId)

  // Filtered queries for selected items
  const { data: selectedReplies } = useCommentReplies(activeMapId, selectedCommentId)
  const { data: selectedReactions } = useCommentReactions(activeMapId, selectedCommentId)
  const { data: selectedCommentPhotos } = useCommentPhotos(activeMapId, selectedCommentId)

  // Actions
  const actions = useMapActions(activeMapId)

  // Reset selections when mapId changes
  useEffect(() => {
    if (!mapId) return
    setSelectedMarkerId(null)
    setSelectedCommentId(null)
    setSelectedPathId(null)
    setSelectedListItemId(null)
    setExpandedComment(null)
    setExpandedPath(null)
  }, [mapId])

  // ── Derived state ──

  const keyMap = meta ? new Map(meta.keys.map((k) => [k.id, k])) : new Map()
  const selectedMarker = meta?.markers.find((m) => m.id === selectedMarkerId) ?? null
  const comments = useMemo(() => commentsList ?? [], [commentsList])
  const selectedComment = comments.find((c) => c.id === selectedCommentId) ?? null
  const paths = useMemo(() => pathsList ?? [], [pathsList])
  const selectedPath = paths.find((p) => p.id === selectedPathId) ?? null

  // Flatten list items with listId for map rendering
  const allListItems = useMemo(() => (allItemsList ?? []).map((item) => ({ ...item, listId: item.listId })), [allItemsList])
  const selectedListItem = allListItems.find((i) => i.id === selectedListItemId) ?? null

  // Paths with preview overrides for MapViewer
  const viewerPaths = useMemo(() =>
    paths.map((p) =>
      p.id === selectedPathId && pathPreview
        ? { ...p, color: pathPreview.color, strokeWidth: pathPreview.strokeWidth }
        : p
    ), [paths, selectedPathId, pathPreview])

  // Reconstruct nested lists for LocationListPanel
  const listsWithItems = (listsList ?? []).map((l) => ({
    ...l,
    items: (allItemsList ?? [])
      .filter((i) => i.listId === l.id)
      .map((i) => ({
        ...i,
        photos: (allItemPhotosList ?? []).filter((p) => p.listItemId === i.id),
      })),
  }))

  // ── Handlers ──

  const handleMapClick = useCallback((x: number, y: number) => {
    if (mode === 'add-comment') {
      setPendingComment({ x, y })
      setCommentText('')
    } else if (mode === 'add-list-item' && selectedListId) {
      setPendingListItem({ x, y })
      setListItemLabel('')
      setListItemDesc('')
    }
  }, [mode, selectedListId])

  const handleSaveComment = () => {
    if (!pendingComment || !commentText.trim() || !mapId) return
    actions.addComment({ x: pendingComment.x, y: pendingComment.y, content: commentText.trim() })
    setPendingComment(null)
    setCommentText('')
    setSidebarTab('comments')
  }

  const handleMarkerSelect = useCallback((m: any) => {
    setSelectedMarkerId(m?.id ?? null)
    if (m) { setSelectedCommentId(null); setSelectedPathId(null); setSelectedListItemId(null) }
  }, [])

  const handleCommentSelect = useCallback((c: any) => {
    setSelectedCommentId(c?.id ?? null)
    if (c) { setSelectedMarkerId(null); setSelectedPathId(null); setSelectedListItemId(null) }
  }, [])

  const handlePathSelect = useCallback((id: string | null) => {
    setSelectedPathId(id)
    if (id) { setSelectedMarkerId(null); setSelectedCommentId(null); setSelectedListItemId(null) }
  }, [])

  const handleListItemSelect = useCallback((i: any) => {
    setSelectedListItemId(i?.id ?? null)
    if (i) { setSelectedMarkerId(null); setSelectedCommentId(null); setSelectedPathId(null) }
  }, [])

  const handlePathDraw = useCallback((points: { x: number; y: number }[]) => {
    setPendingPath(points)
    setPathLabel('')
    setPathColor('#3B82F6')
    setPathWidth(DEFAULT_PATH_WIDTH)
  }, [])

  const handleSavePath = () => {
    if (!pendingPath || !mapId) return
    actions.addPath({
      label: pathLabel,
      color: pathColor,
      strokeWidth: pathWidth,
      pathData: JSON.stringify(pendingPath),
    })
    setPendingPath(null)
    setSidebarTab('paths')
  }

  const handleSaveListItem = () => {
    if (!pendingListItem || !selectedListId) return
    const list = listsWithItems.find((l) => l.id === selectedListId)
    const nextOrder = (list?.items.length ?? 0) + 1
    actions.addListItem({
      listId: selectedListId,
      x: pendingListItem.x,
      y: pendingListItem.y,
      label: listItemLabel || `Item ${nextOrder}`,
      description: listItemDesc,
      sortOrder: nextOrder,
    })
    setPendingListItem(null)
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

        {!loading && meta && (
          <>
            {/* Header */}
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle>{meta.name}</DialogTitle>
                  <DialogDescription>
                    <span className="flex items-center gap-3">
                      {meta.facilityName && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {meta.facilityName}
                        </span>
                      )}
                      {meta.projectName && (
                        <span>{meta.projectName}</span>
                      )}
                      {meta.description && (
                        <span className="truncate">{meta.description}</span>
                      )}
                    </span>
                  </DialogDescription>
                </div>
                <Link to="/maps/$mapId" params={{ mapId: meta.id }}>
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
                {meta.signedUrl ? (
                  <MapViewer
                    signedUrl={meta.signedUrl}
                    fileType={meta.fileType!}
                    width={meta.width!}
                    height={meta.height!}
                    markers={meta.markers}
                    keys={meta.keys}
                    selectedMarkerId={selectedMarkerId}
                    onMarkerSelect={handleMarkerSelect}
                    mode={mode}
                    onMapClick={handleMapClick}
                    comments={comments}
                    selectedCommentId={selectedCommentId}
                    onCommentSelect={handleCommentSelect}
                    paths={viewerPaths}
                    selectedPathId={selectedPathId}
                    onPathSelect={handlePathSelect}
                    onPathDraw={handlePathDraw}
                    pendingPath={pendingPath ? { points: pendingPath, color: pathColor, strokeWidth: pathWidth } : null}
                    listItems={allListItems}
                    selectedListItemId={selectedListItemId}
                    onListItemSelect={handleListItemSelect}
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
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs text-muted-foreground shrink-0">Width:</span>
                      {PATH_WIDTHS.map((w) => (
                        <button
                          key={w}
                          type="button"
                          className="flex items-center justify-center h-6 rounded border text-xs px-1.5"
                          style={{ borderColor: w === pathWidth ? '#3B82F6' : '#d1d5db' }}
                          onClick={() => setPathWidth(w)}
                        >
                          <span
                            className="rounded-full"
                            style={{
                              width: `${Math.max(w, 2)}px`,
                              height: `${Math.max(w, 2)}px`,
                              backgroundColor: pathColor,
                            }}
                          />
                        </button>
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
                      Comments{(commentsList ?? []).length > 0 ? ` (${(commentsList ?? []).length})` : ''}
                    </TabsTrigger>
                    <TabsTrigger value="paths" className="flex-1 text-xs">Paths</TabsTrigger>
                    <TabsTrigger value="lists" className="flex-1 text-xs">Lists</TabsTrigger>
                    <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                  </TabsList>

                  {/* Legend tab */}
                  <TabsContent value="legend" className="mt-0">
                    {meta.keys.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Legend</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-1.5">
                          {meta.keys.map((key) => {
                            const markerCount = meta.markers.filter((m) => m.keyId === key.id).length
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
                      {meta.markers.length} marker{meta.markers.length !== 1 ? 's' : ''}
                    </p>
                  </TabsContent>

                  {/* Comments tab */}
                  <TabsContent value="comments" className="mt-0 space-y-2">
                    {selectedComment && expandedComment === selectedCommentId ? (
                      <>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground mb-1"
                          onClick={() => { setExpandedComment(null); setSelectedCommentId(null) }}
                        >
                          &larr; All comments
                        </button>
                        <CommentThread
                          comment={{
                            ...selectedComment,
                            replies: selectedReplies ?? [],
                            reactions: aggregateReactions(selectedReactions ?? [], ''),
                            photos: selectedCommentPhotos ?? [],
                          }}
                          onReply={(commentId, content) => actions.addReply({ commentId, content })}
                          onToggleReaction={(commentId, emoji) => actions.toggleReaction(commentId, emoji)}
                          onResolve={(commentId) => actions.resolveComment({ commentId })}
                          onReopen={(commentId) => actions.reopenComment({ commentId })}
                          onAddPhoto={(commentId, file) => actions.uploadCommentPhoto(commentId, file)}
                        />
                      </>
                    ) : (
                      <>
                        {comments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No comments yet. Use "Comment" mode to pin comments on the map.
                          </p>
                        ) : (
                          comments.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={`flex w-full items-start gap-2 rounded-lg border p-2 text-left transition-colors ${
                                selectedCommentId === c.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                  : 'border-border hover:bg-muted/50'
                              }`}
                              onClick={() => {
                                if (selectedCommentId === c.id) {
                                  setExpandedComment(c.id)
                                } else {
                                  setSelectedCommentId(c.id)
                                }
                              }}
                            >
                              <span className={`inline-block h-2 w-2 rounded-full mt-1.5 shrink-0 ${c.resolvedAt ? 'bg-green-500' : 'bg-indigo-500'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs truncate">{c.content}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                  {c.resolvedAt && ' · Resolved'}
                                </p>
                              </div>
                              {selectedCommentId === c.id && (
                                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">click to open</span>
                              )}
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
                        onUpdate={(pathId, data) => { setPathPreview(null); actions.updatePath({ pathId, ...data }) }}
                        onDelete={(pathId) => {
                          setPathPreview(null)
                          actions.deletePath({ pathId })
                          setSelectedPathId(null)
                        }}
                        onPreview={setPathPreview}
                      />
                    ) : (
                      <>
                        {(pathsList ?? []).length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No paths yet. Use "Draw Path" mode to draw on the map.
                          </p>
                        ) : (
                          (pathsList ?? []).map((p) => (
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
                      lists={listsWithItems}
                      selectedListId={selectedListId}
                      selectedItemId={selectedListItemId}
                      onSelectList={setSelectedListId}
                      onSelectItem={setSelectedListItemId}
                      onCreateList={(name, desc) => actions.addList({ name, description: desc })}
                      onUpdateItemStatus={(itemId, status) => actions.updateItemStatus({ itemId, status })}
                    />
                    {selectedListItem && (
                      <div className="mt-2">
                        <ListItemDetail
                          item={{
                            ...selectedListItem,
                            photos: (allItemPhotosList ?? []).filter((p) => p.listItemId === selectedListItem.id),
                          }}
                          onUpdateStatus={(itemId, status) => actions.updateItemStatus({ itemId, status })}
                          onAddPhoto={(itemId, file) => actions.uploadListItemPhoto(itemId, file)}
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
                        {meta.markers.length > 0
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

        {!loading && !meta && mapId && (
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
