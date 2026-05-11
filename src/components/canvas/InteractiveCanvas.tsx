import { useRef, useEffect, useCallback } from 'react'
import { usePipelineStore } from '../../store'
import { useCanvasInteraction } from '../../hooks'
import './InteractiveCanvas.css'

export interface InteractiveCanvasProps {
  className?: string
  showGrid?: boolean
  onCanvasClick?: (x: number, y: number) => void
}

export function InteractiveCanvas({ className, showGrid = false, onCanvasClick }: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { sourceImage } = usePipelineStore()

  const {
    transform,
    handlers,
    fitToView,
    resetTransform,
  } = useCanvasInteraction(containerRef, {
    minScale: 0.1,
    maxScale: 10,
    wheelSensitivity: 0.001,
    enablePan: true,
    enableZoom: true,
  })

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = sourceImage.width
    canvas.height = sourceImage.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.putImageData(sourceImage.imageData, 0, 0)

    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height)
    }
  }, [sourceImage, showGrid])

  useEffect(() => {
    render()
  }, [render])

  useEffect(() => {
    if (sourceImage && containerRef.current) {
      fitToView(sourceImage.width, sourceImage.height)
    }
  }, [sourceImage, fitToView])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const applyTransform = () => {
      canvas.style.transform = `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`
      canvas.style.transformOrigin = '0 0'
    }

    applyTransform()
  }, [transform])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCanvasClick) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - transform.offsetX) / transform.scale
    const y = (e.clientY - rect.top - transform.offsetY) / transform.scale

    onCanvasClick(x, y)
  }, [onCanvasClick, transform])

  const zoomPercentage = Math.round(transform.scale * 100)

  return (
    <div className={`interactive-canvas ${className || ''}`}>
      <div
        ref={containerRef}
        className="interactive-canvas__container"
        onWheel={handlers.handleWheel}
        onMouseDown={handlers.handleMouseDown}
        onMouseMove={handlers.handleMouseMove}
        onMouseUp={handlers.handleMouseUp}
      >
        {sourceImage ? (
          <canvas
            ref={canvasRef}
            className="interactive-canvas__canvas"
            onClick={handleCanvasClick}
          />
        ) : (
          <div className="interactive-canvas__placeholder">
            <p>No source image loaded</p>
            <p className="interactive-canvas__placeholder-hint">
              Load a sprite sheet to get started
            </p>
          </div>
        )}
      </div>

      <div className="interactive-canvas__controls">
        <div className="interactive-canvas__zoom-badge" title="Zoom level">
          {zoomPercentage}%
        </div>

        <div className="interactive-canvas__actions">
          <button
            className="interactive-canvas__action-btn"
            onClick={() => fitToView(sourceImage?.width || 0, sourceImage?.height || 0)}
            disabled={!sourceImage}
            title="Fit to view"
          >
            Fit
          </button>

          <button
            className="interactive-canvas__action-btn"
            onClick={resetTransform}
            disabled={!sourceImage}
            title="Reset view"
          >
            Reset
          </button>

          <button
            className="interactive-canvas__action-btn"
            onClick={() => {
              // TODO: Implement zoom in functionality
            }}
            disabled={!sourceImage}
            title="Zoom in"
          >
            +
          </button>

          <button
            className="interactive-canvas__action-btn"
            onClick={() => {
              // TODO: Implement zoom out functionality
            }}
            disabled={!sourceImage}
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      <div className="interactive-canvas__hint">
        Scroll to zoom • Alt+drag or middle-click to pan • Double-click to reset
      </div>
    </div>
  )
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gridSize = 32
  const majorGridSize = gridSize * 4

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1

  for (let x = 0; x <= width; x += gridSize) {
    const isMajor = x % majorGridSize === 0
    ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += gridSize) {
    const isMajor = y % majorGridSize === 0
    ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.restore()
}
