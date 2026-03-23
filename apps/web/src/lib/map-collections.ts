import { z } from 'zod'
import { createCollection, createOptimisticAction } from '@tanstack/db'
import {
  getMap,
  getMaps,
  createMap as createMapFn,
  createMapComment,
  createCommentReply,
  toggleCommentReaction,
  resolveComment as resolveCommentFn,
  reopenComment as reopenCommentFn,
  addCommentPhoto,
  createMapPath,
  updateMapPath,
  deleteMapPath,
  createMapList,
  createMapListItem,
  updateListItemStatus,
  addListItemPhoto,
} from '#/server/db-queries'

// ── Zod schemas (flat entities) ──────────────────────────────────────

// Dates may arrive as Date objects (seroval) or strings (optimistic inserts)
const dateish = z.union([z.string(), z.date()])
const dateishNullable = z.union([z.string(), z.date()]).nullable()

const commentSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  x: z.number(),
  y: z.number(),
  content: z.string(),
  createdBy: z.string().nullable(),
  resolvedAt: dateishNullable,
  resolvedBy: z.string().nullable(),
  createdAt: dateish,
  updatedAt: dateish,
})

const replySchema = z.object({
  id: z.string(),
  commentId: z.string(),
  content: z.string(),
  createdBy: z.string().nullable(),
  createdAt: dateish,
  updatedAt: dateish,
})

const reactionSchema = z.object({
  id: z.string(),
  commentId: z.string(),
  userId: z.string(),
  emoji: z.string(),
  createdAt: dateish,
})

const commentPhotoSchema = z.object({
  id: z.string(),
  commentId: z.string(),
  fileUri: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  createdAt: dateish,
})

const pathSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  label: z.string(),
  color: z.string(),
  strokeWidth: z.number(),
  pathData: z.string(),
  createdBy: z.string().nullable(),
  createdAt: dateish,
  updatedAt: dateish,
})

const listSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  name: z.string(),
  description: z.string(),
  createdBy: z.string().nullable(),
  createdAt: dateish,
  updatedAt: dateish,
})

const listItemSchema = z.object({
  id: z.string(),
  listId: z.string(),
  x: z.number(),
  y: z.number(),
  label: z.string(),
  description: z.string(),
  sortOrder: z.number(),
  status: z.string(),
  completedBy: z.string().nullable(),
  completedAt: dateishNullable,
  createdAt: dateish,
  updatedAt: dateish,
})

const listItemPhotoSchema = z.object({
  id: z.string(),
  listItemId: z.string(),
  fileUri: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  caption: z.string(),
  createdAt: dateish,
})

// ── Exported types ───────────────────────────────────────────────────

export type MapComment = z.infer<typeof commentSchema>
export type CommentReply = z.infer<typeof replySchema>
export type CommentReaction = z.infer<typeof reactionSchema>
export type CommentPhoto = z.infer<typeof commentPhotoSchema>
export type MapPath = z.infer<typeof pathSchema>
export type MapList = z.infer<typeof listSchema>
export type MapListItem = z.infer<typeof listItemSchema>
export type ListItemPhoto = z.infer<typeof listItemPhotoSchema>

type MapData = Awaited<ReturnType<typeof getMap>>

export type MapMeta = {
  id: string
  name: string
  description: string | null
  signedUrl: string | null
  fileType: string | null
  width: number | null
  height: number | null
  facilityId: string | null
  facilityName: string | null
  projectId: string | null
  projectName: string | null
  keys: MapData['keys']
  markers: MapData['markers']
}

// ── Decompose nested getMap response into flat arrays ────────────────

function decomposeMapData(data: MapData) {
  const comments: MapComment[] = []
  const replies: CommentReply[] = []
  const reactions: CommentReaction[] = []
  const commentPhotos: CommentPhoto[] = []

  for (const c of data.comments ?? []) {
    const { replies: reps, reactions: reacts, photos: pics, ...flat } = c
    comments.push(flat as unknown as MapComment)
    for (const r of reps ?? []) replies.push(r as unknown as CommentReply)
    for (const r of reacts ?? []) reactions.push(r as unknown as CommentReaction)
    for (const p of pics ?? []) commentPhotos.push(p as unknown as CommentPhoto)
  }

  const paths = (data.paths ?? []) as unknown as MapPath[]

  const lists: MapList[] = []
  const listItems: MapListItem[] = []
  const listItemPhotosArr: ListItemPhoto[] = []

  for (const l of data.lists ?? []) {
    const { items, ...flatList } = l
    lists.push(flatList as unknown as MapList)
    for (const item of items ?? []) {
      const { photos, ...flatItem } = item
      listItems.push(flatItem as unknown as MapListItem)
      for (const p of photos ?? []) listItemPhotosArr.push(p as unknown as ListItemPhoto)
    }
  }

  return { comments, replies, reactions, commentPhotos, paths, lists, listItems, listItemPhotos: listItemPhotosArr }
}

function extractMeta(data: MapData): MapMeta {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    signedUrl: data.signedUrl,
    fileType: data.fileType,
    width: data.width,
    height: data.height,
    facilityId: data.facilityId,
    facilityName: data.facilityName,
    projectId: data.projectId,
    projectName: data.projectName,
    keys: data.keys,
    markers: data.markers,
  }
}

// ── Collection factory ───────────────────────────────────────────────

type DecomposedKey = keyof ReturnType<typeof decomposeMapData>

interface CollectionEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  syncParams: any | null
  extractKey: DecomposedKey
}

function createMapCollections(mapId: string) {
  const entries: CollectionEntry[] = []

  // Shared fetch cache — reuse result for 5 min so reopening the map is instant
  let cachedFetch: Promise<MapData> | null = null
  let cacheTimer: ReturnType<typeof setTimeout> | null = null
  const CACHE_TTL = 5 * 60_000

  function fetchMapCached(): Promise<MapData> {
    if (!cachedFetch) {
      cachedFetch = getMap({ data: { mapId } })
      if (cacheTimer) clearTimeout(cacheTimer)
      cacheTimer = setTimeout(() => { cachedFetch = null }, CACHE_TTL)
    }
    return cachedFetch
  }

  // Helper to create a synced collection
  function makeColl<T extends z.ZodObject<any>>(
    name: string,
    schema: T,
    extractKey: DecomposedKey,
  ) {
    const entry: CollectionEntry = { syncParams: null, extractKey }
    entries.push(entry)

    return createCollection({
      id: `${name}-${mapId}`,
      schema,
      getKey: (item: z.infer<T>) => item.id as string,
      sync: {
        sync: (params: any) => {
          entry.syncParams = params

          fetchMapCached().then((result) => {
            const decomposed = decomposeMapData(result)
            const items = decomposed[extractKey] as z.infer<T>[]
            params.begin()
            for (const item of items) {
              params.write({ key: item.id, type: 'insert' as const, value: item })
            }
            params.commit()
            params.markReady()
          })
        },
        rowUpdateMode: 'full' as const,
      },
    })
  }

  // ── Collections ──
  const comments = makeColl('comments', commentSchema, 'comments')
  const replies = makeColl('replies', replySchema, 'replies')
  const reactions = makeColl('reactions', reactionSchema, 'reactions')
  const commentPhotosCol = makeColl('comment-photos', commentPhotoSchema, 'commentPhotos')
  const paths = makeColl('paths', pathSchema, 'paths')
  const lists = makeColl('lists', listSchema, 'lists')
  const listItems = makeColl('list-items', listItemSchema, 'listItems')
  const listItemPhotosCol = makeColl('list-item-photos', listItemPhotoSchema, 'listItemPhotos')

  // ── Refetch all collections from server ──
  async function refetchAll() {
    cachedFetch = null // Invalidate stale cache
    const result = await getMap({ data: { mapId } })
    // Re-populate cache with fresh data
    cachedFetch = Promise.resolve(result)
    if (cacheTimer) clearTimeout(cacheTimer)
    cacheTimer = setTimeout(() => { cachedFetch = null }, CACHE_TTL)
    const decomposed = decomposeMapData(result)

    for (const entry of entries) {
      if (!entry.syncParams) continue
      const items = decomposed[entry.extractKey] as { id: string }[]
      entry.syncParams.begin()
      entry.syncParams.truncate()
      for (const item of items) {
        entry.syncParams.write({ key: item.id, type: 'insert', value: item })
      }
      entry.syncParams.commit()
    }

    return result
  }

  // ── Fetch metadata (static data: keys, markers, map info) ──
  async function fetchMeta(): Promise<MapMeta> {
    const result = await fetchMapCached()
    return extractMeta(result)
  }

  // ── Optimistic actions ──

  const addComment = createOptimisticAction<{ x: number; y: number; content: string }>({
    onMutate: ({ x, y, content }) => {
      comments.insert({
        id: crypto.randomUUID(),
        mapId,
        x, y, content,
        createdBy: null,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    mutationFn: async ({ x, y, content }) => {
      await createMapComment({ data: { mapId, x, y, content } })
      await refetchAll()
    },
  })

  const addReply = createOptimisticAction<{ commentId: string; content: string }>({
    onMutate: ({ commentId, content }) => {
      replies.insert({
        id: crypto.randomUUID(),
        commentId,
        content,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    mutationFn: async ({ commentId, content }) => {
      await createCommentReply({ data: { commentId, content } })
      await refetchAll()
    },
  })

  const resolveComment = createOptimisticAction<{ commentId: string }>({
    onMutate: ({ commentId }) => {
      comments.update(commentId, (draft) => {
        draft.resolvedAt = new Date().toISOString()
        draft.resolvedBy = 'current-user'
      })
    },
    mutationFn: async ({ commentId }) => {
      await resolveCommentFn({ data: { commentId } })
      await refetchAll()
    },
  })

  const reopenComment = createOptimisticAction<{ commentId: string }>({
    onMutate: ({ commentId }) => {
      comments.update(commentId, (draft) => {
        draft.resolvedAt = null
        draft.resolvedBy = null
      })
    },
    mutationFn: async ({ commentId }) => {
      await reopenCommentFn({ data: { commentId } })
      await refetchAll()
    },
  })

  const addPath = createOptimisticAction<{ label: string; color: string; strokeWidth: number; pathData: string }>({
    onMutate: ({ label, color, strokeWidth, pathData }) => {
      paths.insert({
        id: crypto.randomUUID(),
        mapId,
        label, color, strokeWidth, pathData,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    mutationFn: async (data) => {
      await createMapPath({ data: { mapId, ...data } })
      await refetchAll()
    },
  })

  const updatePath = createOptimisticAction<{ pathId: string; label: string; color: string; strokeWidth: number }>({
    onMutate: ({ pathId, label, color, strokeWidth }) => {
      paths.update(pathId, (draft) => {
        draft.label = label
        draft.color = color
        draft.strokeWidth = strokeWidth
      })
    },
    mutationFn: async (data) => {
      await updateMapPath({ data })
      await refetchAll()
    },
  })

  const deletePath = createOptimisticAction<{ pathId: string }>({
    onMutate: ({ pathId }) => {
      paths.delete(pathId)
    },
    mutationFn: async ({ pathId }) => {
      await deleteMapPath({ data: { pathId } })
      await refetchAll()
    },
  })

  const addList = createOptimisticAction<{ name: string; description: string }>({
    onMutate: ({ name, description }) => {
      lists.insert({
        id: crypto.randomUUID(),
        mapId,
        name, description,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    mutationFn: async ({ name, description }) => {
      await createMapList({ data: { mapId, name, description } })
      await refetchAll()
    },
  })

  const addListItem = createOptimisticAction<{ listId: string; x: number; y: number; label: string; description: string; sortOrder: number }>({
    onMutate: ({ listId, x, y, label, description, sortOrder }) => {
      listItems.insert({
        id: crypto.randomUUID(),
        listId, x, y, label, description, sortOrder,
        status: 'pending',
        completedBy: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    mutationFn: async (data) => {
      await createMapListItem({ data })
      await refetchAll()
    },
  })

  const updateItemStatus = createOptimisticAction<{ itemId: string; status: string }>({
    onMutate: ({ itemId, status }) => {
      listItems.update(itemId, (draft) => {
        draft.status = status
        if (status === 'completed') {
          draft.completedAt = new Date().toISOString()
        } else {
          draft.completedBy = null
          draft.completedAt = null
        }
      })
    },
    mutationFn: async ({ itemId, status }) => {
      await updateListItemStatus({ data: { itemId, status } })
      await refetchAll()
    },
  })

  // ── Non-optimistic mutations (file uploads) ──

  async function toggleReaction(commentId: string, emoji: string) {
    await toggleCommentReaction({ data: { commentId, emoji } })
    await refetchAll()
  }

  async function uploadCommentPhoto(commentId: string, file: File) {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'comment-photos')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    await addCommentPhoto({ data: { commentId, fileUri: data.filePath, fileName: file.name, fileSize: file.size } })
    await refetchAll()
  }

  async function uploadListItemPhoto(itemId: string, file: File) {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'list-photos')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    await addListItemPhoto({ data: { listItemId: itemId, fileUri: data.filePath, fileName: file.name, fileSize: file.size, caption: '' } })
    await refetchAll()
  }

  return {
    // Collections
    comments,
    replies,
    reactions,
    commentPhotos: commentPhotosCol,
    paths,
    lists,
    listItems,
    listItemPhotos: listItemPhotosCol,

    // Actions
    actions: {
      addComment,
      addReply,
      resolveComment,
      reopenComment,
      addPath,
      updatePath,
      deletePath,
      addList,
      addListItem,
      updateItemStatus,
      toggleReaction,
      uploadCommentPhoto,
      uploadListItemPhoto,
    },

    // Utilities
    fetchMeta,
    refetchAll,
    mapId,
  }
}

export type MapCollections = ReturnType<typeof createMapCollections>

// ── Cache ────────────────────────────────────────────────────────────

const collectionsCache = new Map<string, MapCollections>()

export function getMapCollections(mapId: string): MapCollections {
  let existing = collectionsCache.get(mapId)
  if (!existing) {
    existing = createMapCollections(mapId)
    collectionsCache.set(mapId, existing)
  }
  return existing
}

export function cleanupMapCollections(mapId: string) {
  collectionsCache.delete(mapId)
}

// ══════════════════════════════════════════════════════════════════════
// Maps List Collection (for the /maps index page)
// ══════════════════════════════════════════════════════════════════════

const mapsListSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  fileType: z.string().nullable(),
  fileUri: z.string().nullable(),
  fileName: z.string().nullable(),
  createdAt: dateish,
  updatedAt: dateish,
  facilityName: z.string().nullable(),
  facilityAddress: z.string().nullable(),
  projectName: z.string().nullable(),
  projectId: z.string().nullable(),
  signedUrl: z.string().nullable(),
})

export type MapsListItem = z.infer<typeof mapsListSchema>

let mapsListInstance: ReturnType<typeof createMapsListCollection> | null = null

export function getMapsListCollection() {
  if (mapsListInstance) return mapsListInstance
  mapsListInstance = createMapsListCollection()
  return mapsListInstance
}

function createMapsListCollection() {

  let syncParams: any = null

  const collection = createCollection({
    id: 'maps-list',
    schema: mapsListSchema,
    getKey: (item: MapsListItem) => item.id,
    sync: {
      sync: (params: any) => {
        syncParams = params

        getMaps().then((result) => {
          params.begin()
          for (const item of result) {
            params.write({ key: item.id, type: 'insert' as const, value: item })
          }
          params.commit()
          params.markReady()
        })
      },
      rowUpdateMode: 'full' as const,
    },
  })

  async function refetch() {
    if (!syncParams) return
    const result = await getMaps()
    syncParams.begin()
    syncParams.truncate()
    for (const item of result) {
      syncParams.write({ key: item.id, type: 'insert' as const, value: item })
    }
    syncParams.commit()
  }

  const addMap = createOptimisticAction<{
    name: string
    description: string
    facilityId: string
    projectId?: string
    fileType: string
    fileUri: string
    fileName: string
    fileSize: number
    width: number
    height: number
    facilityName: string
    projectName?: string
  }>({
    onMutate: (vars) => {
      collection.insert({
        id: crypto.randomUUID(),
        name: vars.name,
        description: vars.description,
        fileType: vars.fileType,
        fileUri: vars.fileUri,
        fileName: vars.fileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        facilityName: vars.facilityName,
        facilityAddress: null,
        projectName: vars.projectName ?? null,
        projectId: vars.projectId ?? null,
        signedUrl: `/api/files?path=${encodeURIComponent(vars.fileUri)}`,
      })
    },
    mutationFn: async (vars) => {
      await createMapFn({
        data: {
          name: vars.name,
          description: vars.description,
          facilityId: vars.facilityId,
          ...(vars.projectId ? { projectId: vars.projectId } : {}),
          fileType: vars.fileType,
          fileUri: vars.fileUri,
          fileName: vars.fileName,
          fileSize: vars.fileSize,
          width: vars.width,
          height: vars.height,
        },
      })
      await refetch()
    },
  })

  return {
    collection,
    actions: { addMap },
    refetch,
  }
}
