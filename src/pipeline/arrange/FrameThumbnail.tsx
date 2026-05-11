import { useRef, useEffect, memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Frame } from '../../types'

interface FrameThumbnailProps {
  frame: Frame
  sourceImage: ImageData | null
  onDoubleClick?: () => void
}

export const FrameThumbnail = memo(({ frame, sourceImage, onDoubleClick }: FrameThumbnailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: frame.id,
    data: { frame: { id: frame.id }, type: 'frame' as const },
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = frame.region.rect.width
    canvas.height = frame.region.rect.height

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = sourceImage.width
    tempCanvas.height = sourceImage.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCtx.putImageData(sourceImage, 0, 0)

    ctx.drawImage(
      tempCanvas,
      frame.region.rect.x,
      frame.region.rect.y,
      frame.region.rect.width,
      frame.region.rect.height,
      0,
      0,
      frame.region.rect.width,
      frame.region.rect.height
    )
  }, [frame, sourceImage])

  return (
    <div
      ref={setNodeRef}
      className={`frame-thumbnail${isDragging ? ' dragging' : ''}`}
      {...listeners}
      {...attributes}
      onDoubleClick={onDoubleClick}
    >
      <canvas ref={canvasRef} />
      <span className="frame-duration-badge">{frame.durationMs}</span>
    </div>
  )
})
