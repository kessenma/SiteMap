import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Upload, X, FileText } from 'lucide-react'
import { createMap } from '#/server/db-queries'

export function AddMapDialog({
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
