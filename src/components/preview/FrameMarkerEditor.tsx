import { useState, useRef, useCallback, useEffect } from 'react'
import { usePipelineStore } from '../../store'
import {
  renderAlignmentPreview,
  hitTestMarker,
  initializeDefaultMarkers,
  type AlignmentPreviewState,
  type MarkerName,
  MARKER_CONFIGS,
} from '../../pipeline/preview'
import './FrameMarkerEditor.css'

export function FrameMarkerEditor() {
  const { frames, setSkeletalMarker } = usePipelineStore()
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0)
  const [previewState, setPreviewState] = useState<AlignmentPreviewState>({
    selectedMarker: null,
    isEditing: false,
    showLabels: true,
    showConnections: true,
  })
  const [scale, setScale] = useState(2)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentFrame = frames[selectedFrameIndex]
  const markers = currentFrame?.skeletalMarkers

  useEffect(() => {
    render()
  }, [currentFrame, previewState, scale])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !currentFrame || !markers) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frameWidth = currentFrame.region.rect.width
    const frameHeight = currentFrame.region.rect.height

    canvas.width = frameWidth * scale
    canvas.height = frameHeight * scale

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (currentFrame.imageData) {
      ctx.putImageData(currentFrame.imageData, 0, 0)
    }

    renderAlignmentPreview(markers, ctx, previewState, scale)
  }, [currentFrame, markers, previewState, scale])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !currentFrame) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clickedMarker = markers ? hitTestMarker(x, y, markers, scale) : null

    if (clickedMarker) {
      setPreviewState((prev) => ({
        ...prev,
        selectedMarker: prev.selectedMarker === clickedMarker ? null : clickedMarker,
      }))
    } else if (previewState.selectedMarker && previewState.isEditing) {
      const newPoint = { x: x / scale, y: y / scale }
      setSkeletalMarker(currentFrame.id, previewState.selectedMarker, newPoint)
    }
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !currentFrame) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    if (previewState.selectedMarker) {
      setSkeletalMarker(currentFrame.id, previewState.selectedMarker, { x, y })
      setPreviewState((prev) => ({ ...prev, isEditing: false }))
    }
  }

  const handleMarkerSelect = (markerName: MarkerName) => {
    setPreviewState((prev) => ({
      ...prev,
      selectedMarker: prev.selectedMarker === markerName ? null : markerName,
      isEditing: false,
    }))
  }

  const handleToggleEdit = () => {
    setPreviewState((prev) => ({ ...prev, isEditing: !prev.isEditing }))
  }

  const handleInitializeMarkers = () => {
    if (!currentFrame) return

    const defaultMarkers = initializeDefaultMarkers(
      currentFrame.region.rect.width,
      currentFrame.region.rect.height
    )

    for (const [markerName, point] of Object.entries(defaultMarkers) as [MarkerName, { x: number; y: number }][]) {
      setSkeletalMarker(currentFrame.id, markerName, point)
    }
  }

  const handlePreviousFrame = () => {
    setSelectedFrameIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextFrame = () => {
    setSelectedFrameIndex((prev) => Math.min(frames.length - 1, prev + 1))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.max(0.5, Math.min(4, prev * delta)))
  }

  return (
    <div className="frame-marker-editor">
      <div className="frame-marker-editor__header">
        <h2>Frame Marker Editor</h2>
        <div className="frame-marker-editor__frame-nav">
          <button
            onClick={handlePreviousFrame}
            disabled={selectedFrameIndex === 0}
            className="frame-marker-editor__nav-btn"
          >
            ← Prev
          </button>
          <span className="frame-marker-editor__frame-counter">
            Frame {selectedFrameIndex + 1} / {frames.length}
          </span>
          <button
            onClick={handleNextFrame}
            disabled={selectedFrameIndex === frames.length - 1}
            className="frame-marker-editor__nav-btn"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="frame-marker-editor__main">
        <div className="frame-marker-editor__canvas-container" ref={containerRef}>
          {currentFrame ? (
            <canvas
              ref={canvasRef}
              className="frame-marker-editor__canvas"
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
              onWheel={handleWheel}
            />
          ) : (
            <div className="frame-marker-editor__placeholder">
              <p>No frames available</p>
            </div>
          )}
        </div>

        <div className="frame-marker-editor__sidebar">
          <div className="frame-marker-editor__controls">
            <h3>Markers</h3>
            <div className="frame-marker-editor__marker-list">
              {Object.entries(MARKER_CONFIGS).map(([name, config]) => (
                <button
                  key={name}
                  className={`frame-marker-editor__marker-item ${
                    previewState.selectedMarker === name ? 'active' : ''
                  }`}
                  onClick={() => handleMarkerSelect(name as MarkerName)}
                  style={{ '--marker-color': config.color } as React.CSSProperties}
                >
                  <span
                    className="frame-marker-editor__marker-dot"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </button>
              ))}
            </div>

            <div className="frame-marker-editor__actions">
              <button
                className="frame-marker-editor__action-btn"
                onClick={handleInitializeMarkers}
                disabled={!currentFrame}
              >
                Initialize Default Markers
              </button>

              {previewState.selectedMarker && (
                <>
                  <button
                    className={`frame-marker-editor__action-btn ${
                      previewState.isEditing ? 'active' : ''
                    }`}
                    onClick={handleToggleEdit}
                  >
                    {previewState.isEditing ? 'Finish Editing' : 'Edit Position'}
                  </button>
                  <p className="frame-marker-editor__edit-hint">
                    {previewState.isEditing
                      ? 'Double-click to place marker'
                      : 'Select a marker to edit'}
                  </p>
                </>
              )}
            </div>

            <div className="frame-marker-editor__options">
              <label className="frame-marker-editor__option">
                <input
                  type="checkbox"
                  checked={previewState.showLabels}
                  onChange={(e) =>
                    setPreviewState((prev) => ({ ...prev, showLabels: e.target.checked }))
                  }
                />
                Show Labels
              </label>
              <label className="frame-marker-editor__option">
                <input
                  type="checkbox"
                  checked={previewState.showConnections}
                  onChange={(e) =>
                    setPreviewState((prev) => ({ ...prev, showConnections: e.target.checked }))
                  }
                />
                Show Connections
              </label>
            </div>

            <div className="frame-marker-editor__scale-control">
              <label>Zoom: {Math.round(scale * 100)}%</label>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {markers && previewState.selectedMarker && (
        <div className="frame-marker-editor__marker-info">
          <strong>{MARKER_CONFIGS[previewState.selectedMarker].label}:</strong>{' '}
          ({Math.round(markers[previewState.selectedMarker as keyof typeof markers].x)},{' '}
          {Math.round(markers[previewState.selectedMarker as keyof typeof markers].y)})
        </div>
      )}
    </div>
  )
}
