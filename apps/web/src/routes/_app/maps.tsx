import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '#/components/ui/sheet'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { getMaps, getFacilities, getProjects, createFacility, createMap } from '#/server/db-queries'
import { Map, Building2, ArrowRight, Plus, Upload, X, FileText, MapPin } from 'lucide-react'

export const Route = createFileRoute('/_app/maps')({
  loader: async () => {
    const [maps, facilities, projects] = await Promise.all([getMaps(), getFacilities(), getProjects()])
    return { maps, facilities, projects }
  },
  component: Maps,
})

function Maps() {
  const { maps, facilities, projects } = Route.useLoaderData()
  const router = useRouter()
  const [selectedFacility, setSelectedFacility] = useState<{ id: string; name: string; address?: string | null } | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showAddFacility, setShowAddFacility] = useState(false)
  const [showAddMap, setShowAddMap] = useState(false)

  const hasFacilities = facilities.length > 0

  const mapCountByFacility = maps.reduce<Record<string, number>>((acc, m) => {
    if (m.facilityName) acc[m.facilityName] = (acc[m.facilityName] || 0) + 1
    return acc
  }, {})

  const facilityMaps = selectedFacility
    ? maps.filter((m) => m.facilityName === selectedFacility.name)
    : []

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maps</h1>
          <p className="text-sm text-muted-foreground">All uploaded floor plans and site maps</p>
        </div>
        <Button size="icon" onClick={() => setShowAddMenu(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {facilities.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
          {facilities.map((facility) => {
            const count = mapCountByFacility[facility.name] ?? 0
            return (
              <button
                key={facility.id}
                onClick={() => setSelectedFacility(facility)}
                className="flex min-w-[140px] flex-col rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold truncate">{facility.name}</span>
                </div>
                {facility.address && (
                  <p className="mt-1 text-xs text-muted-foreground truncate">{facility.address}</p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {count} map{count !== 1 ? 's' : ''}
                </p>
              </button>
            )
          })}
        </div>
      )}

      {maps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Map className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-sm font-medium">No maps yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFacilities ? 'Upload your first map to get started.' : 'Add a facility to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Maps</CardTitle>
            <CardDescription>
              {maps.length} map{maps.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maps.map((map) => (
                  <TableRow key={map.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {map.signedUrl && map.fileType === 'image' ? (
                          <img
                            src={map.signedUrl}
                            alt={map.name}
                            className="h-10 w-10 rounded object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-muted">
                            {map.fileType === 'pdf' ? (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Map className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">{map.name}</span>
                          {map.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{map.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {map.facilityName ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{map.facilityName}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {map.projectId ? (
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: map.projectId }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {map.projectName}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(map.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {map.projectId && (
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: map.projectId }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* "What would you like to add?" chooser */}
      <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What would you like to add?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <button
              className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
              onClick={() => {
                setShowAddMenu(false)
                setShowAddFacility(true)
              }}
            >
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Facility</p>
                <p className="text-xs text-muted-foreground">A building, plant, or site</p>
              </div>
            </button>
            <button
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                hasFacilities ? 'hover:bg-accent' : 'opacity-40 cursor-not-allowed'
              }`}
              onClick={() => {
                if (!hasFacilities) return
                setShowAddMenu(false)
                setShowAddMap(true)
              }}
            >
              <Map className={`h-5 w-5 ${hasFacilities ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-semibold">Map</p>
                <p className="text-xs text-muted-foreground">
                  {hasFacilities ? 'A floor plan or site map' : 'Add a facility first'}
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Facility dialog */}
      <AddFacilityDialog
        open={showAddFacility}
        onOpenChange={setShowAddFacility}
        onCreated={() => router.invalidate()}
      />

      {/* Add Map dialog */}
      <AddMapDialog
        open={showAddMap}
        onOpenChange={setShowAddMap}
        facilities={facilities}
        projects={projects}
        onCreated={() => router.invalidate()}
      />

      {/* Facility maps sheet */}
      <Sheet open={!!selectedFacility} onOpenChange={(open) => { if (!open) setSelectedFacility(null) }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{selectedFacility?.name}</SheetTitle>
            {selectedFacility?.address && (
              <SheetDescription>{selectedFacility.address}</SheetDescription>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {facilityMaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No maps for this facility</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {facilityMaps.map((map) => (
                  <Link
                    key={map.id}
                    to={map.projectId ? '/projects/$projectId' : '/maps'}
                    params={map.projectId ? { projectId: map.projectId } : {}}
                    className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    {map.signedUrl && map.fileType === 'image' ? (
                      <img
                        src={map.signedUrl}
                        alt={map.name}
                        className="h-10 w-10 rounded object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-muted shrink-0">
                        {map.fileType === 'pdf' ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Map className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{map.name}</p>
                      {map.description && (
                        <p className="text-xs text-muted-foreground truncate">{map.description}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Updated {new Date(map.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function AddFacilityDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await createFacility({ data: { name: name.trim(), address: address.trim() } })
      setName('')
      setAddress('')
      onOpenChange(false)
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Facility</DialogTitle>
          <DialogDescription>A building, plant, or site to attach maps to.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="facility-name">Name</Label>
            <Input
              id="facility-name"
              placeholder="e.g. Downtown Plant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="facility-address">Address</Label>
            <Input
              id="facility-address"
              placeholder="e.g. 123 Main St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save Facility'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddMapDialog({
  open,
  onOpenChange,
  facilities,
  projects,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  facilities: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)

    const url = URL.createObjectURL(selected)
    setFilePreview(url)

    if (selected.type.startsWith('image/')) {
      const img = new Image()
      img.onload = () => {
        setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.src = url
    } else {
      setFileDimensions({ width: 0, height: 0 })
    }
  }

  const clearFile = () => {
    setFile(null)
    setFilePreview(null)
    setFileDimensions({ width: 0, height: 0 })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !facilityId || !file) return
    setSaving(true)
    try {
      // Upload file to object storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'maps')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.error || 'File upload failed')
      }

      const { filePath } = await uploadRes.json()

      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'
      await createMap({
        data: {
          name: name.trim(),
          description: description.trim(),
          facilityId,
          ...(projectId ? { projectId } : {}),
          fileType,
          fileUri: filePath,
          fileName: file.name,
          fileSize: file.size,
          width: fileDimensions.width,
          height: fileDimensions.height,
        },
      })
      setName('')
      setDescription('')
      setFacilityId(null)
      setProjectId(null)
      clearFile()
      onOpenChange(false)
      onCreated()
    } catch (err: any) {
      console.error('Failed to save map:', err)
      alert(err.message || 'Failed to save map. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isPdf = file?.type === 'application/pdf'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Map</DialogTitle>
          <DialogDescription>A floor plan or site map for a facility.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="map-name">Name</Label>
            <Input
              id="map-name"
              placeholder="e.g. Building A - Floor 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="map-description">Description</Label>
            <Input
              id="map-description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>File <span className="text-destructive">*</span></Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="relative rounded-lg border border-border overflow-hidden">
                {isPdf ? (
                  <div className="flex items-center gap-3 bg-muted/50 p-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={filePreview!}
                    alt="Preview"
                    className="h-40 w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Upload PNG, JPG, or PDF</span>
              </button>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Facility</Label>
            <Select value={facilityId ?? undefined} onValueChange={setFacilityId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Project <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Select value={projectId ?? undefined} onValueChange={setProjectId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={saving || !name.trim() || !facilityId || !file}>
            {saving ? 'Saving...' : 'Save Map'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
