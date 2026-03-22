import { createCollection, localOnlyCollectionOptions } from '@tanstack/db'

// Project type matching our server function return
type ProjectRow = {
  id: string
  name: string
  description: string
  address: string
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  mapCount: number
}

// Marker type matching our server function return
type MarkerRow = {
  id: string
  label: string
  description: string
  status: string
  createdAt: Date
  updatedAt: Date
  keyLabel: string
  keyColor: string
  keyShape: string
  mapName: string
  projectName: string
  projectId: string
}

// Local-only collections for client-side reactive state
// These get populated from server function data and enable
// live queries, filtering, and optimistic updates on the client
export const projectsCollection = createCollection(
  localOnlyCollectionOptions<ProjectRow, string>({
    id: 'projects',
    getKey: (project) => project.id,
  })
)

export const markersCollection = createCollection(
  localOnlyCollectionOptions<MarkerRow, string>({
    id: 'markers',
    getKey: (marker) => marker.id,
  })
)
