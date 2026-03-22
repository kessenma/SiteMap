import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { DrawingCanvas } from './DrawingCanvas'

type IconPickerResult = {
  iconType: 'shape' | 'image' | 'drawn' | 'text'
  iconShape?: string
  iconColor: string
  iconText?: string
  customIconUri?: string
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const
const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16',
]

export function IconPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (result: IconPickerResult) => void
}) {
  const [tab, setTab] = useState<string>('shape')
  const [shape, setShape] = useState<string>('circle')
  const [color, setColor] = useState('#3B82F6')
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'icons')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      onSelect({ iconType: 'image', iconColor: color, customIconUri: data.filePath })
      onClose()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrawingSave = async (blob: Blob) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', new File([blob], 'drawn-icon.png', { type: 'image/png' }))
      form.append('folder', 'drawn-icons')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      onSelect({ iconType: 'drawn', iconColor: color, customIconUri: data.filePath })
      onClose()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Icon</DialogTitle>
        </DialogHeader>

        <div className="mb-3">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Color</Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="h-6 w-6 rounded-full border-2 shrink-0"
                style={{
                  backgroundColor: c,
                  borderColor: c === color ? '#000' : '#d1d5db',
                }}
                onClick={() => setColor(c)}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-6 w-6 cursor-pointer border-0 p-0"
            />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="shape" className="flex-1">Shape</TabsTrigger>
            <TabsTrigger value="text" className="flex-1">Text/Emoji</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
            <TabsTrigger value="draw" className="flex-1">Draw</TabsTrigger>
          </TabsList>

          <TabsContent value="shape" className="mt-3">
            <div className="flex gap-3">
              {SHAPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="flex flex-col items-center gap-1 rounded-lg border-2 p-3"
                  style={{ borderColor: s === shape ? color : '#e5e7eb' }}
                  onClick={() => setShape(s)}
                >
                  <svg width={32} height={32} viewBox="-16 -16 32 32">
                    {s === 'circle' && <circle r={12} fill={color} />}
                    {s === 'square' && <rect x={-10} y={-10} width={20} height={20} fill={color} />}
                    {s === 'triangle' && <path d="M0,-12 L12,12 L-12,12Z" fill={color} />}
                    {s === 'diamond' && <path d="M0,-12 L12,0 L0,12 L-12,0Z" fill={color} />}
                  </svg>
                  <span className="text-xs capitalize">{s}</span>
                </button>
              ))}
            </div>
            <Button
              className="mt-3 w-full"
              onClick={() => {
                onSelect({ iconType: 'shape', iconShape: shape, iconColor: color })
                onClose()
              }}
            >
              Use Shape
            </Button>
          </TabsContent>

          <TabsContent value="text" className="mt-3 space-y-3">
            <div>
              <Label className="text-xs">Text or Emoji</Label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A, 1, 🔥, ⚡..."
                maxLength={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quick:</span>
              {['🔥', '⚡', '⚠️', '✅', '❌', '📍', '🏗️', '🔧'].map((e) => (
                <button
                  key={e}
                  type="button"
                  className="text-lg hover:scale-125 transition-transform"
                  onClick={() => setText(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            {text && (
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: color,
                    fontSize: 18,
                  }}
                >
                  {text.slice(0, 2)}
                </span>
              </div>
            )}
            <Button
              className="w-full"
              disabled={!text}
              onClick={() => {
                onSelect({ iconType: 'text', iconColor: color, iconText: text })
                onClose()
              }}
            >
              Use Text
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="mt-3 space-y-3">
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                id="icon-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
              <label
                htmlFor="icon-upload"
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                {uploading ? 'Uploading...' : 'Click to upload PNG, JPG, WebP, or SVG'}
              </label>
            </div>
          </TabsContent>

          <TabsContent value="draw" className="mt-3">
            {uploading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Saving...</p>
            ) : (
              <DrawingCanvas onSave={handleDrawingSave} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
