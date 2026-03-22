import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ArrowLeft, Building2 } from 'lucide-react'
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
import { MapViewer } from '#/components/maps/MapViewer'
import { MapToolbar } from '#/components/maps/MapToolbar'
import { MarkerDetailPanel } from '#/components/maps/MarkerDetailPanel'
import { KeyIconPreview } from '#/components/maps/KeyIconPreview'
import { CommentThread } from '#/components/maps/CommentThread'
import { PathDetailPanel } from '#/components/maps/PathDetailPanel'
import { LocationListPanel } from '#/components/maps/LocationListPanel'
import { ListItemDetail } from '#/components/maps/ListItemDetail'
import type { MapMode } from '#/components/maps/map-constants'
import { PATH_COLORS } from '#/components/maps/map-constants'

type MapDetail = Awaited<ReturnType<typeof getMap>>

export const Route = createFileRoute('/_app/maps/$mapId')({
  loader: async ({ params }) => {
    return getMap({ data: { mapId: params.mapId } })
  },
  component: MapDetailPage,
})

function MapDetailPage() {
  const initialMap = Route.useLoaderData()
  const [map, setMap] = useState<MapDetail>(initialMap)
  const [mode, setMode] = useState<MapMode>('select')
  const [sidebarTab, setSidebarTab] = useState('legend')

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedListItemId, setSelectedListItemId] = useState<string | null>(null)

  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null)
  const [commentText, setCommentText] = useState('')
  const [pendingPath, setPendingPath] = useState<{ x: number; y: number }[] | null>(null)
  const [pathLabel, setPathLabel] = useState('')
  const [pathColor, setPathColor] = useState('#3B82F6')
  const [pendingListItem, setPendingListItem] = useState<{ x: number; y: number } | null>(null)
  const [listItemLabel, setListItemLabel] = useState('')
  const [listItemDesc, setListItemDesc] = useState('')

  const reload = useCallback(async () => {
    const result = await getMap({ data: { mapId: map.id } })
    setMap(result)
  }, [map.id])

  const keyMap = new Map(map.keys.map((k) => [k.id, k]))
  const selectedMarker = map.markers.find((m) => m.id === selectedMarkerId) ?? null
  const selectedComment = map.comments?.find((c) => c.id === selectedCommentId) ?? null
  const selectedPath = map.paths?.find((p) => p.id === selectedPathId) ?? null
  const allListItems = map.lists?.flatMap((l) => l.items.map((item) => ({ ...item, listId: l.id }))) ?? []
  const selectedListItem = allListItems.find((i) => i.id === selectedListItemId) ?? null

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
    if (!pendingComment || !commentText.trim()) return
    await createMapComment({ data: { mapId: map.id, x: pendingComment.x, y: pendingComment.y, content: commentText.trim() } })
    setPendingComment(null)
    setCommentText('')
    await reload()
    setSidebarTab('comments')
  }

  const handlePathDraw = (points: { x: number; y: number }[]) => {
    setPendingPath(points)
    setPathLabel('')
    setPathColor('#3B82F6')
  }

  const handleSavePath = async () => {
    if (!pendingPath) return
    await createMapPath({ data: { mapId: map.id, label: pathLabel, color: pathColor, strokeWidth: 2, pathData: JSON.stringify(pendingPath) } })
    setPendingPath(null)
    await reload()
    setSidebarTab('paths')
  }

  const handleSaveListItem = async () => {
    if (!pendingListItem || !selectedListId) return
    const list = map.lists?.find((l) => l.id === selectedListId)
    const nextOrder = (list?.items.length ?? 0) + 1
    await createMapListItem({ data: { listId: selectedListId, x: pendingListItem.x, y: pendingListItem.y, label: listItemLabel || `Item ${nextOrder}`, description: listItemDesc, sortOrder: nextOrder } })
    setPendingListItem(null)
    await reload()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/maps" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate">{map.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {map.facilityName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {map.facilityName}
              </span>
            )}
            {map.projectName && (
              <Link
                to="/projects/$projectId"
                params={{ projectId: map.projectId! }}
                className="text-blue-600 hover:underline"
              >
                {map.projectName}
              </Link>
            )}
          </div>
        </div>
        <MapToolbar mode={mode} onModeChange={setMode} />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 relative">
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
                if (m) { setSelectedCommentId(null); setSelectedPathId(null); setSelectedListItemId(null); setSidebarTab('details') }
              }}
              mode={mode}
              onMapClick={handleMapClick}
              comments={map.comments ?? []}
              selectedCommentId={selectedCommentId}
              onCommentSelect={(c) => {
                setSelectedCommentId(c?.id ?? null)
                if (c) { setSelectedMarkerId(null); setSelectedPathId(null); setSelectedListItemId(null); setSidebarTab('comments') }
              }}
              paths={map.paths ?? []}
              selectedPathId={selectedPathId}
              onPathSelect={(id) => {
                setSelectedPathId(id)
                if (id) { setSelectedMarkerId(null); setSelectedCommentId(null); setSelectedListItemId(null); setSidebarTab('paths') }
              }}
              onPathDraw={handlePathDraw}
              listItems={allListItems}
              selectedListItemId={selectedListItemId}
              onListItemSelect={(i) => {
                setSelectedListItemId(i?.id ?? null)
                if (i) { setSelectedMarkerId(null); setSelectedCommentId(null); setSelectedPathId(null); setSidebarTab('lists') }
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No file uploaded for this map.
            </div>
          )}

          {/* Floating comment dialog */}
          {pendingComment && (
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border bg-background p-3 shadow-lg">
              <div className="flex gap-2">
                <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="h-8 text-sm" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveComment() }} />
                <Button size="sm" className="h-8" onClick={handleSaveComment}>Post</Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setPendingComment(null)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Floating path dialog */}
          {pendingPath && (
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border bg-background p-3 shadow-lg">
              <div className="flex gap-2 mb-2">
                {PATH_COLORS.map((c) => (
                  <button key={c} type="button" className="h-5 w-5 rounded-full border-2 shrink-0" style={{ backgroundColor: c, borderColor: c === pathColor ? '#000' : '#d1d5db' }} onClick={() => setPathColor(c)} />
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={pathLabel} onChange={(e) => setPathLabel(e.target.value)} placeholder="Label (optional)" className="h-8 text-sm" autoFocus />
                <Button size="sm" className="h-8" onClick={handleSavePath}>Save</Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setPendingPath(null)}>Discard</Button>
              </div>
            </div>
          )}

          {/* Floating list item dialog */}
          {pendingListItem && (
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border bg-background p-3 shadow-lg">
              <div className="flex flex-col gap-2">
                <Input value={listItemLabel} onChange={(e) => setListItemLabel(e.target.value)} placeholder="Label..." className="h-8 text-sm" autoFocus />
                <Input value={listItemDesc} onChange={(e) => setListItemDesc(e.target.value)} placeholder="Description (optional)" className="h-8 text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" className="h-8" onClick={handleSaveListItem}>Add Item</Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setPendingListItem(null)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 overflow-y-auto border-l border-border p-4">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
            <TabsList className="w-full mb-3">
              <TabsTrigger value="legend" className="flex-1 text-xs">Legend</TabsTrigger>
              <TabsTrigger value="comments" className="flex-1 text-xs">Comments</TabsTrigger>
              <TabsTrigger value="paths" className="flex-1 text-xs">Paths</TabsTrigger>
              <TabsTrigger value="lists" className="flex-1 text-xs">Lists</TabsTrigger>
              <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="legend" className="mt-0">
              {map.keys.length > 0 && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Legend</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
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
                          <span className="text-sm truncate">{key.label}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{markerCount}</span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-0 space-y-2">
              {selectedComment ? (
                <CommentThread
                  comment={{
                    ...selectedComment,
                    replies: selectedComment.replies ?? [],
                    reactions: aggregateReactions(selectedComment.reactions ?? []),
                    photos: selectedComment.photos ?? [],
                  }}
                  onReply={async (cId, content) => { await createCommentReply({ data: { commentId: cId, content } }); await reload() }}
                  onToggleReaction={async (cId, emoji) => { await toggleCommentReaction({ data: { commentId: cId, emoji } }); await reload() }}
                  onResolve={async (cId) => { await resolveComment({ data: { commentId: cId } }); await reload() }}
                  onReopen={async (cId) => { await reopenComment({ data: { commentId: cId } }); await reload() }}
                  onAddPhoto={async (cId, file) => {
                    const form = new FormData(); form.append('file', file); form.append('folder', 'comment-photos')
                    const res = await fetch('/api/upload', { method: 'POST', body: form }); const data = await res.json()
                    await addCommentPhoto({ data: { commentId: cId, fileUri: data.filePath, fileName: file.name, fileSize: file.size } }); await reload()
                  }}
                />
              ) : (
                (map.comments ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No comments yet.</p>
                ) : (
                  (map.comments ?? []).map((c) => (
                    <button key={c.id} type="button" className="flex w-full items-start gap-2 rounded-lg border border-border p-2 text-left hover:bg-muted/50" onClick={() => setSelectedCommentId(c.id)}>
                      <span className={`inline-block h-2 w-2 rounded-full mt-1.5 shrink-0 ${c.resolvedAt ? 'bg-green-500' : 'bg-indigo-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs truncate">{c.content}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}{c.resolvedAt && ' · Resolved'}</p>
                      </div>
                    </button>
                  ))
                )
              )}
            </TabsContent>

            <TabsContent value="paths" className="mt-0 space-y-2">
              {selectedPath ? (
                <PathDetailPanel
                  path={selectedPath}
                  onUpdate={async (pId, d) => { await updateMapPath({ data: { pathId: pId, ...d } }); await reload() }}
                  onDelete={async (pId) => { await deleteMapPath({ data: { pathId: pId } }); setSelectedPathId(null); await reload() }}
                />
              ) : (
                (map.paths ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No paths yet.</p>
                ) : (
                  (map.paths ?? []).map((p) => (
                    <button key={p.id} type="button" className="flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left hover:bg-muted/50" onClick={() => setSelectedPathId(p.id)}>
                      <span className="inline-block h-3 w-6 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-xs truncate flex-1">{p.label || 'Untitled path'}</span>
                    </button>
                  ))
                )
              )}
            </TabsContent>

            <TabsContent value="lists" className="mt-0">
              <LocationListPanel
                lists={(map.lists ?? []).map((l) => ({ ...l, items: l.items.map((i) => ({ ...i, photos: i.photos })) }))}
                selectedListId={selectedListId}
                selectedItemId={selectedListItemId}
                onSelectList={setSelectedListId}
                onSelectItem={setSelectedListItemId}
                onCreateList={async (name, desc) => { await createMapList({ data: { mapId: map.id, name, description: desc } }); await reload() }}
                onUpdateItemStatus={async (iId, status) => { await updateListItemStatus({ data: { itemId: iId, status } }); await reload() }}
              />
              {selectedListItem && (
                <div className="mt-2">
                  <ListItemDetail
                    item={{ ...selectedListItem, photos: selectedListItem.photos }}
                    onUpdateStatus={async (iId, status) => { await updateListItemStatus({ data: { itemId: iId, status } }); await reload() }}
                    onAddPhoto={async (iId, file) => {
                      const form = new FormData(); form.append('file', file); form.append('folder', 'list-photos')
                      const res = await fetch('/api/upload', { method: 'POST', body: form }); const data = await res.json()
                      await addListItemPhoto({ data: { listItemId: iId, fileUri: data.filePath, fileName: file.name, fileSize: file.size, caption: '' } }); await reload()
                    }}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-0">
              {selectedMarker ? (
                <MarkerDetailPanel marker={selectedMarker} keyDef={keyMap.get(selectedMarker.keyId)} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {map.markers.length > 0 ? 'Click a marker to see details.' : 'No markers on this map yet.'}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function aggregateReactions(reactions: { emoji: string; userId: string }[]) {
  const map = new Map<string, { count: number; hasReacted: boolean }>()
  for (const r of reactions) {
    const existing = map.get(r.emoji) ?? { count: 0, hasReacted: false }
    existing.count++
    map.set(r.emoji, existing)
  }
  return Array.from(map, ([emoji, { count, hasReacted }]) => ({ emoji, count, hasReacted }))
}
