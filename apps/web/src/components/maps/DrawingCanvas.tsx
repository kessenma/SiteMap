import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '#/components/ui/button'
import { Eraser, Undo2 } from 'lucide-react'

const CANVAS_SIZE = 128
const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#fff']

export function DrawingCanvas({
  onSave,
}: {
  onSave: (blob: Blob) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const historyRef = useRef<ImageData[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    historyRef.current = [ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)]
  }, [])

  const getPos = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = CANVAS_SIZE / rect.width
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDrawing(true)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    canvas.setPointerCapture(e.pointerId)
  }, [color, strokeWidth, getPos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing) return
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }, [drawing, getPos])

  const handlePointerUp = useCallback(() => {
    setDrawing(false)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.closePath()
    historyRef.current.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE))
  }, [])

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return
    historyRef.current.pop()
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0)
  }

  const handleClear = () => {
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    historyRef.current = [ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)]
  }

  const handleSave = () => {
    canvasRef.current!.toBlob((blob) => {
      if (blob) onSave(blob)
    }, 'image/png')
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full max-w-[256px] border border-border rounded-lg cursor-crosshair touch-none"
        style={{ imageRendering: 'pixelated' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      <div className="flex items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className="h-5 w-5 rounded-full border-2 shrink-0"
            style={{
              backgroundColor: c,
              borderColor: c === color ? '#3B82F6' : '#d1d5db',
            }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Size:</label>
        {[2, 3, 6, 10].map((w) => (
          <button
            key={w}
            type="button"
            className="flex items-center justify-center h-6 w-6 rounded border"
            style={{
              borderColor: w === strokeWidth ? '#3B82F6' : '#d1d5db',
            }}
            onClick={() => setStrokeWidth(w)}
          >
            <span
              className="rounded-full bg-foreground"
              style={{ width: w + 2, height: w + 2 }}
            />
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleUndo}>
          <Undo2 className="h-3.5 w-3.5 mr-1" /> Undo
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
        <Button size="sm" onClick={handleSave} className="ml-auto">
          Save Icon
        </Button>
      </div>
    </div>
  )
}
