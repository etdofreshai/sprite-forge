import { useRef, useEffect, useCallback } from 'react'
import { useCanvasInteraction } from '../../hooks'
import type { SpriteSheetSource } from '../../types'
import type { DetectedFrame } from '../../pipeline/split'
import './SplitPreview.css'

export interface SplitPreviewProps {
  sourceImage: SpriteSheetSource
  detectedFrames: DetectedFrame[]
  selectedFrameIndex: number | null
  onSelectFrame: (index: number) => void
  onRemoveFrame: (index: number) => void
}

export function SplitPreview({
  sourceImage,
  detectedFrames,
  selectedFrameIndex,
  onSelectFrame,
  onRemoveFrame,
}: SplitPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

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
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = sourceImage.width
    canvas.height = sourceImage.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.putImageData(sourceImage.imageData, 0, 0)

    overlay.style.width = `${sourceImage.width}px`
    overlay.style.height = `${sourceImage.height}px`
    overlay.innerHTML = ''

    detectedFrames.forEach((frame, index) => {
      const isSelected = index === selectedFrameIndex
      const box = document.createElement('div')
      box.className = `split-preview__bounding-box ${isSelected ? 'selected' : ''}`
      box.style.left = `${frame.x0}px`
      box.style.top = `${frame.y0}px`
      box.style.width = `${frame.x1 - frame.x0 + 1}px`
      box.style.height = `${frame.y1 - frame.y0 + 1}px`

      box.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectFrame(index)
      })

      if (isSelected) {
        const removeBtn = document.createElement('button')
        removeBtn.className = 'split-preview__remove-btn'
        removeBtn.textContent = '×'
        removeBtn.title = 'Remove this frame'
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          onRemoveFrame(index)
        })
        box.appendChild(removeBtn)

        const info = document.createElement('div')
        info.className = 'split-preview__frame-info'
        info.innerHTML = `
          <span>#${index + 1}</span>
          <span>${frame.x1 - frame.x0 + 1}×${frame.y1 - frame.y0 + 1}</span>
          <span>${frame.opaquePixels}px</span>
        `
        box.appendChild(info)
      }

      overlay.appendChild(box)
    })
  }, [sourceImage, detectedFrames, selectedFrameIndex, onSelectFrame, onRemoveFrame])

  useEffect(() => {
    render()
  }, [render])

  useEffect(() => {
    if (containerRef.current) {
      fitToView(sourceImage.width, sourceImage.height)
    }
  }, [sourceImage, fitToView])

  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    const applyTransform = () => {
      const transformStyle = `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`
      canvas.style.transform = transformStyle
      canvas.style.transformOrigin = '0 0'
      overlay.style.transform = transformStyle
      overlay.style.transformOrigin = '0 0'
    }

    applyTransform()
  }, [transform])

  const zoomPercentage = Math.round(transform.scale * 100)

  return (
    <div className="split-preview">
      <div className="split-preview__header">
        <h3>Preview</h3>
        <div className="split-preview__controls">
          <span className="split-preview__zoom-badge">{zoomPercentage}%</span>
          <button
            className="split-preview__control-btn"
            onClick={() => fitToView(sourceImage.width, sourceImage.height)}
            title="Fit to view"
          >
            Fit
          </button>
          <button
            className="split-preview__control-btn"
            onClick={resetTransform}
            title="Reset view"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="split-preview__container"
        onWheel={handlers.handleWheel}
        onMouseDown={handlers.handleMouseDown}
        onMouseMove={handlers.handleMouseMove}
        onMouseUp={handlers.handleMouseUp}
      >
        <div className="split-preview__content">
          <canvas ref={canvasRef} className="split-preview__canvas" />
          <div ref={overlayRef} className="split-preview__overlay" />
        </div>
      </div>

      <div className="split-preview__hint">
        Scroll to zoom • Alt+drag to pan • Click bounding box to select • Press × to remove
      </div>

      {selectedFrameIndex !== null && detectedFrames[selectedFrameIndex] && (
        <div className="split-preview__selected-info">
          <strong>Frame #{selectedFrameIndex + 1}</strong>
          <span>
            Position: ({detectedFrames[selectedFrameIndex].x0}, {detectedFrames[selectedFrameIndex].y0})
          </span>
          <span>
            Size: {detectedFrames[selectedFrameIndex].x1 - detectedFrames[selectedFrameIndex].x0 + 1}×
            {detectedFrames[selectedFrameIndex].y1 - detectedFrames[selectedFrameIndex].y0 + 1}
          </span>
          <span>Opaque: {detectedFrames[selectedFrameIndex].opaquePixels} pixels</span>
        </div>
      )}
    </div>
  )
}
