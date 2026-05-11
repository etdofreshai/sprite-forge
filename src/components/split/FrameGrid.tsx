import { useRef, useEffect, useState } from 'react'
import type { SpriteSheetSource } from '../../types'
import type { DetectedFrame } from '../../pipeline/split'
import './FrameGrid.css'

export interface FrameGridProps {
  sourceImage: SpriteSheetSource | null
  detectedFrames: DetectedFrame[]
  selectedFrameIndex: number | null
  onSelectFrame: (index: number) => void
}

const THUMBNAIL_SIZE = 80

export function FrameGrid({ sourceImage, detectedFrames, selectedFrameIndex, onSelectFrame }: FrameGridProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const [renderedFrames, setRenderedFrames] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!sourceImage) return

    detectedFrames.forEach((frame, index) => {
      if (renderedFrames.has(index)) return

      const canvas = canvasRefs.current[index]
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = frame.x1 - frame.x0 + 1
      const height = frame.y1 - frame.y0 + 1

      canvas.width = width
      canvas.height = height

      const imageData = new ImageData(width, height)
      const sourceData = sourceImage.imageData.data
      const destData = imageData.data

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = frame.x0 + x
          const srcY = frame.y0 + y
          const srcIdx = (srcY * sourceImage.width + srcX) * 4
          const destIdx = (y * width + x) * 4

          destData[destIdx] = sourceData[srcIdx]
          destData[destIdx + 1] = sourceData[srcIdx + 1]
          destData[destIdx + 2] = sourceData[srcIdx + 2]
          destData[destIdx + 3] = sourceData[srcIdx + 3]
        }
      }

      ctx.putImageData(imageData, 0, 0)

      setRenderedFrames((prev) => new Set(prev).add(index))
    })
  }, [sourceImage, detectedFrames, renderedFrames])

  return (
    <div className="frame-grid">
      <div className="frame-grid__header">
        <h3>Detected Frames ({detectedFrames.length})</h3>
      </div>

      <div className="frame-grid__container">
        {detectedFrames.map((frame, index) => {
          const isSelected = index === selectedFrameIndex
          const width = frame.x1 - frame.x0 + 1
          const height = frame.y1 - frame.y0 + 1

          const scale = Math.min(
            THUMBNAIL_SIZE / width,
            THUMBNAIL_SIZE / height,
            1
          )

          const scaledWidth = width * scale
          const scaledHeight = height * scale

          return (
            <div
              key={index}
              className={`frame-grid__item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectFrame(index)}
            >
              <div
                className="frame-grid__thumbnail"
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                }}
              >
                <canvas
                  ref={(el) => (canvasRefs.current[index] = el)}
                  className="frame-grid__canvas"
                  style={{
                    width: `${scaledWidth}px`,
                    height: `${scaledHeight}px`,
                  }}
                />
              </div>

              <div className="frame-grid__info">
                <span className="frame-grid__index">#{index + 1}</span>
                <span className="frame-grid__size">
                  {width}×{height}
                </span>
              </div>

              {isSelected && (
                <div className="frame-grid__details">
                  <div>Position: ({frame.x0}, {frame.y0})</div>
                  <div>Opaque: {frame.opaquePixels}px</div>
                </div>
              )}
            </div>
          )
        })}

        {detectedFrames.length === 0 && (
          <div className="frame-grid__empty">
            <p>No frames detected yet</p>
            <p className="frame-grid__empty-hint">
              Adjust detection settings and run detection to find frames
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
