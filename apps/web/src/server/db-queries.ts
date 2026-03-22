import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db'
import {
  projects, maps, mapMarkers, mapKeys, facilities,
  mapComments, commentReplies, commentReactions, commentPhotos,
  mapPaths, mapLists, mapListItems, listItemPhotos,
} from '#/db/schema'
import { desc, eq, count, asc, and } from 'drizzle-orm'
import { getAuthSession } from './auth-middleware'

export const getProjects = createServerFn({ method: 'GET' }).handler(async () => {
  await getAuthSession()
  const result = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      address: projects.address,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      mapCount: count(maps.id),
    })
    .from(projects)
    .leftJoin(maps, eq(maps.projectId, projects.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt))

  return result
})

export const getProject = createServerFn({ method: 'GET' })
  .inputValidator((projectId: string) => projectId)
  .handler(async ({ data: projectId }) => {
    await getAuthSession()
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    if (!project) throw new Error('Project not found')

    const projectMaps = await db
      .select()
      .from(maps)
      .where(eq(maps.projectId, projectId))
      .orderBy(desc(maps.updatedAt))

    return { ...project, maps: projectMaps }
  })

export const getRecentMarkers = createServerFn({ method: 'GET' }).handler(async () => {
  await getAuthSession()
  const result = await db
    .select({
      id: mapMarkers.id,
      label: mapMarkers.label,
      description: mapMarkers.description,
      status: mapMarkers.status,
      createdAt: mapMarkers.createdAt,
      updatedAt: mapMarkers.updatedAt,
      keyLabel: mapKeys.label,
      keyColor: mapKeys.iconColor,
      keyShape: mapKeys.iconShape,
      mapName: maps.name,
      projectName: projects.name,
      projectId: projects.id,
    })
    .from(mapMarkers)
    .innerJoin(mapKeys, eq(mapMarkers.keyId, mapKeys.id))
    .innerJoin(maps, eq(mapMarkers.mapId, maps.id))
    .innerJoin(projects, eq(maps.projectId, projects.id))
    .orderBy(desc(mapMarkers.updatedAt))
    .limit(50)

  return result
})

export const getProjectMarkers = createServerFn({ method: 'GET' })
  .inputValidator((projectId: string) => projectId)
  .handler(async ({ data: projectId }) => {
    await getAuthSession()
    const result = await db
      .select({
        id: mapMarkers.id,
        label: mapMarkers.label,
        description: mapMarkers.description,
        status: mapMarkers.status,
        x: mapMarkers.x,
        y: mapMarkers.y,
        createdAt: mapMarkers.createdAt,
        updatedAt: mapMarkers.updatedAt,
        keyLabel: mapKeys.label,
        keyColor: mapKeys.iconColor,
        keyShape: mapKeys.iconShape,
        mapName: maps.name,
        mapId: maps.id,
      })
      .from(mapMarkers)
      .innerJoin(mapKeys, eq(mapMarkers.keyId, mapKeys.id))
      .innerJoin(maps, eq(mapMarkers.mapId, maps.id))
      .where(eq(maps.projectId, projectId))
      .orderBy(desc(mapMarkers.updatedAt))

    return result
  })

export const getMaps = createServerFn({ method: 'GET' }).handler(async () => {
  await getAuthSession()
  const result = await db
    .select({
      id: maps.id,
      name: maps.name,
      description: maps.description,
      fileType: maps.fileType,
      fileUri: maps.fileUri,
      fileName: maps.fileName,
      createdAt: maps.createdAt,
      updatedAt: maps.updatedAt,
      facilityName: facilities.name,
      facilityAddress: facilities.address,
      projectName: projects.name,
      projectId: projects.id,
    })
    .from(maps)
    .leftJoin(projects, eq(maps.projectId, projects.id))
    .leftJoin(facilities, eq(maps.facilityId, facilities.id))
    .orderBy(desc(maps.updatedAt))

  const mapsWithUrls = result.map((m) => ({
    ...m,
    signedUrl: m.fileUri ? `/api/files?path=${encodeURIComponent(m.fileUri)}` : null,
  }))

  return mapsWithUrls
})

export const getMap = createServerFn({ method: 'GET' })
  .inputValidator((data: { mapId: string }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()

    const [map] = await db
      .select({
        id: maps.id,
        name: maps.name,
        description: maps.description,
        fileType: maps.fileType,
        fileUri: maps.fileUri,
        fileName: maps.fileName,
        fileSize: maps.fileSize,
        width: maps.width,
        height: maps.height,
        createdAt: maps.createdAt,
        updatedAt: maps.updatedAt,
        facilityId: facilities.id,
        facilityName: facilities.name,
        projectId: projects.id,
        projectName: projects.name,
      })
      .from(maps)
      .leftJoin(projects, eq(maps.projectId, projects.id))
      .leftJoin(facilities, eq(maps.facilityId, facilities.id))
      .where(eq(maps.id, data.mapId))
      .limit(1)

    if (!map) throw new Error('Map not found')

    const keys = await db
      .select()
      .from(mapKeys)
      .where(eq(mapKeys.mapId, data.mapId))
      .orderBy(asc(mapKeys.sortOrder))

    const markers = await db
      .select({
        id: mapMarkers.id,
        keyId: mapMarkers.keyId,
        x: mapMarkers.x,
        y: mapMarkers.y,
        label: mapMarkers.label,
        description: mapMarkers.description,
        status: mapMarkers.status,
        createdAt: mapMarkers.createdAt,
        updatedAt: mapMarkers.updatedAt,
      })
      .from(mapMarkers)
      .where(eq(mapMarkers.mapId, data.mapId))
      .orderBy(desc(mapMarkers.updatedAt))

    // Fetch comments with replies, reactions, photos
    const commentsRaw = await db
      .select()
      .from(mapComments)
      .where(eq(mapComments.mapId, data.mapId))
      .orderBy(desc(mapComments.createdAt))

    const commentsWithDetails = await Promise.all(
      commentsRaw.map(async (c) => {
        const [replies, reactions, photos] = await Promise.all([
          db.select().from(commentReplies).where(eq(commentReplies.commentId, c.id)).orderBy(asc(commentReplies.createdAt)),
          db.select().from(commentReactions).where(eq(commentReactions.commentId, c.id)),
          db.select().from(commentPhotos).where(eq(commentPhotos.commentId, c.id)).orderBy(asc(commentPhotos.createdAt)),
        ])
        return { ...c, replies, reactions, photos }
      }),
    )

    // Fetch paths
    const pathsData = await db
      .select()
      .from(mapPaths)
      .where(eq(mapPaths.mapId, data.mapId))
      .orderBy(asc(mapPaths.createdAt))

    // Fetch lists with items
    const listsRaw = await db
      .select()
      .from(mapLists)
      .where(eq(mapLists.mapId, data.mapId))
      .orderBy(asc(mapLists.createdAt))

    const listsWithItems = await Promise.all(
      listsRaw.map(async (l) => {
        const items = await db
          .select()
          .from(mapListItems)
          .where(eq(mapListItems.listId, l.id))
          .orderBy(asc(mapListItems.sortOrder))

        const itemsWithPhotos = await Promise.all(
          items.map(async (item) => {
            const photos = await db
              .select()
              .from(listItemPhotos)
              .where(eq(listItemPhotos.listItemId, item.id))
              .orderBy(asc(listItemPhotos.createdAt))
            return { ...item, photos }
          }),
        )
        return { ...l, items: itemsWithPhotos }
      }),
    )

    return {
      ...map,
      signedUrl: map.fileUri ? `/api/files?path=${encodeURIComponent(map.fileUri)}` : null,
      keys,
      markers,
      comments: commentsWithDetails,
      paths: pathsData,
      lists: listsWithItems,
    }
  })

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  await getAuthSession()
  const [[projectCount], [markerCount], [activeCount], [flaggedCount]] = await Promise.all([
    db.select({ value: count() }).from(projects),
    db.select({ value: count() }).from(mapMarkers),
    db.select({ value: count() }).from(mapMarkers).where(eq(mapMarkers.status, 'active')),
    db.select({ value: count() }).from(mapMarkers).where(eq(mapMarkers.status, 'flagged')),
  ])

  return {
    projects: projectCount.value,
    totalMarkers: markerCount.value,
    activeMarkers: activeCount.value,
    flaggedMarkers: flaggedCount.value,
  }
})

export const getFacilities = createServerFn({ method: 'GET' }).handler(async () => {
  await getAuthSession()
  return db.select().from(facilities).orderBy(asc(facilities.name))
})

export const createFacility = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string; address: string }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()
    const [facility] = await db
      .insert(facilities)
      .values({ name: data.name, address: data.address })
      .returning()
    return facility
  })

export const createMap = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
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
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const [map] = await db
      .insert(maps)
      .values({
        name: data.name,
        description: data.description,
        facilityId: data.facilityId,
        projectId: data.projectId ?? null,
        fileType: data.fileType as 'pdf' | 'image',
        fileUri: data.fileUri,
        fileName: data.fileName,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        createdBy: session.user.id,
      })
      .returning()
    return map
  })

// ── Map Comments ──────────────────────────────────────────────────────

export const createMapComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { mapId: string; x: number; y: number; content: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const [comment] = await db
      .insert(mapComments)
      .values({
        mapId: data.mapId,
        x: data.x,
        y: data.y,
        content: data.content,
        createdBy: session.user.id,
      })
      .returning()
    return comment
  })

export const createCommentReply = createServerFn({ method: 'POST' })
  .inputValidator((data: { commentId: string; content: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const [reply] = await db
      .insert(commentReplies)
      .values({
        commentId: data.commentId,
        content: data.content,
        createdBy: session.user.id,
      })
      .returning()
    return reply
  })

export const toggleCommentReaction = createServerFn({ method: 'POST' })
  .inputValidator((data: { commentId: string; emoji: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const existing = await db
      .select()
      .from(commentReactions)
      .where(
        and(
          eq(commentReactions.commentId, data.commentId),
          eq(commentReactions.userId, session.user.id),
          eq(commentReactions.emoji, data.emoji as any),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      await db.delete(commentReactions).where(eq(commentReactions.id, existing[0].id))
      return { action: 'removed' as const }
    }

    await db.insert(commentReactions).values({
      commentId: data.commentId,
      userId: session.user.id,
      emoji: data.emoji as any,
    })
    return { action: 'added' as const }
  })

export const resolveComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { commentId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    await db
      .update(mapComments)
      .set({ resolvedAt: new Date(), resolvedBy: session.user.id })
      .where(eq(mapComments.id, data.commentId))
  })

export const reopenComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { commentId: string }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()
    await db
      .update(mapComments)
      .set({ resolvedAt: null, resolvedBy: null })
      .where(eq(mapComments.id, data.commentId))
  })

export const addCommentPhoto = createServerFn({ method: 'POST' })
  .inputValidator((data: { commentId: string; fileUri: string; fileName: string; fileSize: number }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()
    const [photo] = await db
      .insert(commentPhotos)
      .values({
        commentId: data.commentId,
        fileUri: data.fileUri,
        fileName: data.fileName,
        fileSize: data.fileSize,
      })
      .returning()
    return photo
  })

// ── Map Paths ─────────────────────────────────────────────────────────

export const createMapPath = createServerFn({ method: 'POST' })
  .inputValidator((data: { mapId: string; label: string; color: string; strokeWidth: number; pathData: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const [path] = await db
      .insert(mapPaths)
      .values({
        mapId: data.mapId,
        label: data.label,
        color: data.color,
        strokeWidth: data.strokeWidth,
        pathData: data.pathData,
        createdBy: session.user.id,
      })
      .returning()
    return path
  })

export const updateMapPath = createServerFn({ method: 'POST' })
  .inputValidator((data: { pathId: string; label: string; color: string; strokeWidth: number }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()
    await db
      .update(mapPaths)
      .set({ label: data.label, color: data.color, strokeWidth: data.strokeWidth })
      .where(eq(mapPaths.id, data.pathId))
  })

export const deleteMapPath = createServerFn({ method: 'POST' })
  .inputValidator((data: { pathId: string }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()
    await db.delete(mapPaths).where(eq(mapPaths.id, data.pathId))
  })

// ── Location Lists ────────────────────────────────────────────────────

export const createMapList = createServerFn({ method: 'POST' })
  .inputValidator((data: { mapId: string; name: string; description: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const [list] = await db
      .insert(mapLists)
      .values({
        mapId: data.mapId,
        name: data.name,
        description: data.description,
        createdBy: session.user.id,
      })
      .returning()
    return list
  })

export const createMapListItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { listId: string; x: number; y: number; label: string; description: string; sortOrder: number }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()
    const [item] = await db
      .insert(mapListItems)
      .values({
        listId: data.listId,
        x: data.x,
        y: data.y,
        label: data.label,
        description: data.description,
        sortOrder: data.sortOrder,
      })
      .returning()
    return item
  })

export const updateListItemStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { itemId: string; status: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const updates: Record<string, unknown> = {
      status: data.status,
    }
    if (data.status === 'completed') {
      updates.completedBy = session.user.id
      updates.completedAt = new Date()
    } else {
      updates.completedBy = null
      updates.completedAt = null
    }
    await db
      .update(mapListItems)
      .set(updates as any)
      .where(eq(mapListItems.id, data.itemId))
  })

export const addListItemPhoto = createServerFn({ method: 'POST' })
  .inputValidator((data: { listItemId: string; fileUri: string; fileName: string; fileSize: number; caption: string }) => data)
  .handler(async ({ data }) => {
    await getAuthSession()
    const [photo] = await db
      .insert(listItemPhotos)
      .values({
        listItemId: data.listItemId,
        fileUri: data.fileUri,
        fileName: data.fileName,
        fileSize: data.fileSize,
        caption: data.caption,
      })
      .returning()
    return photo
  })
