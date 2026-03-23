import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'
import { getMapCollections, getMapsListCollection, type MapMeta, type MapCollections } from '#/lib/map-collections'

// ── Get collections instance (stable per mapId) ──

export function useMapCollections(mapId: string): MapCollections {
  return useMemo(() => getMapCollections(mapId), [mapId])
}

// ── Fetch static metadata (keys, markers, map info) ──

export function useMapMeta(mapId: string | null) {
  const [meta, setMeta] = useState<MapMeta | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!mapId) {
      setMeta(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const collections = getMapCollections(mapId)
    collections.fetchMeta().then((m) => {
      setMeta(m)
      setLoading(false)
    }).catch(() => {
      setMeta(null)
      setLoading(false)
    })
  }, [mapId])

  return { meta, loading }
}

// ── Live queries for mutable data ──

export function useMapComments(mapId: string) {
  const { comments } = useMapCollections(mapId)
  return useLiveQuery(comments)
}

export function useMapPaths(mapId: string) {
  const { paths } = useMapCollections(mapId)
  return useLiveQuery(paths)
}

export function useMapLists(mapId: string) {
  const { lists } = useMapCollections(mapId)
  return useLiveQuery(lists)
}

export function useAllListItems(mapId: string) {
  const { listItems } = useMapCollections(mapId)
  return useLiveQuery(listItems)
}

export function useAllListItemPhotos(mapId: string) {
  const { listItemPhotos } = useMapCollections(mapId)
  return useLiveQuery(listItemPhotos)
}

// ── Filtered queries for selected items ──

export function useCommentReplies(mapId: string, commentId: string | null) {
  const { replies } = useMapCollections(mapId)
  return useLiveQuery(
    (q) => commentId
      ? q.from({ r: replies }).where(({ r }) => eq(r.commentId, commentId))
      : undefined,
    [commentId],
  )
}

export function useCommentReactions(mapId: string, commentId: string | null) {
  const { reactions } = useMapCollections(mapId)
  return useLiveQuery(
    (q) => commentId
      ? q.from({ r: reactions }).where(({ r }) => eq(r.commentId, commentId))
      : undefined,
    [commentId],
  )
}

export function useCommentPhotos(mapId: string, commentId: string | null) {
  const { commentPhotos } = useMapCollections(mapId)
  return useLiveQuery(
    (q) => commentId
      ? q.from({ p: commentPhotos }).where(({ p }) => eq(p.commentId, commentId))
      : undefined,
    [commentId],
  )
}

export function useListItemPhotosFor(mapId: string, itemId: string | null) {
  const { listItemPhotos } = useMapCollections(mapId)
  return useLiveQuery(
    (q) => itemId
      ? q.from({ p: listItemPhotos }).where(({ p }) => eq(p.listItemId, itemId))
      : undefined,
    [itemId],
  )
}

// ── Actions (stable per mapId) ──

export function useMapActions(mapId: string) {
  const collections = useMapCollections(mapId)
  return collections.actions
}

// ══════════════════════════════════════════════════════════════════════
// Maps List (for /maps index page)
// ══════════════════════════════════════════════════════════════════════

export function useMapsList() {
  const { collection } = useMemo(() => getMapsListCollection(), [])
  return useLiveQuery(collection)
}

export function useMapsListActions() {
  const { actions } = useMemo(() => getMapsListCollection(), [])
  return actions
}
