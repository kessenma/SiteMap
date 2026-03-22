import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db'
import { projects, maps, mapMarkers, mapKeys, facilities } from '#/db/schema'
import { desc, eq, count, asc } from 'drizzle-orm'
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

  return result
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
