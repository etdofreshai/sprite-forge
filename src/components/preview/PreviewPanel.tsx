import { useState, useEffect, useRef, useCallback } from 'react'
import { usePipelineStore } from '../../store'
import {
  AnimationPlayer,
  getCurrentFrame,
  getOnionSkinFrames,
  renderFrame,
  renderOnionSkin,
  renderSkeletalMarkers,
  type PlaybackState,
} from '../../pipeline/preview'
import './PreviewPanel.css'

export function PreviewPanel() {
  const { frames, animations } = usePipelineStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<AnimationPlayer | null>(null)

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentFrameIndex: 0,
    currentAnimationId: animations[0]?.id || null,
    fps: 12,
    loop: true,
    onionSkinEnabled: false,
    onionSkinOpacity: 0.3,
    showMarkers: true,
  })

  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const currentFrame = getCurrentFrame(playbackState, frames, animations)
  const onionSkinFrames = getOnionSkinFrames(playbackState, frames, animations)

  useEffect(() => {
    if (!playerRef.current) {
      playerRef.current = new AnimationPlayer(playbackState, setPlaybackState)
    }

    return () => {
      playerRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    render()
  }, [currentFrame, onionSkinFrames, playbackState, scale, pan])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !currentFrame) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frameWidth = currentFrame.region.rect.width
    const frameHeight = currentFrame.region.rect.height

    canvas.width = frameWidth * scale
    canvas.height = frameHeight * scale

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)

    if (playbackState.onionSkinEnabled && onionSkinFrames.length > 0) {
      renderOnionSkin(onionSkinFrames, ctx, playbackState.onionSkinOpacity)
    }

    if (currentFrame.imageData) {
      renderFrame(currentFrame, ctx)
    }

    if (playbackState.showMarkers && currentFrame.skeletalMarkers) {
      renderSkeletalMarkers(currentFrame.skeletalMarkers, ctx, scale)
    }

    ctx.restore()
  }, [currentFrame, onionSkinFrames, playbackState, scale, pan])

  const handlePlayPause = () => {
    if (playerRef.current) {
      playerRef.current.toggle()
    }
  }

  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.stop()
      setPlaybackState((prev) => ({ ...prev, currentFrameIndex: 0 }))
    }
  }

  const handleNextFrame = () => {
    const totalFrames = playbackState.currentAnimationId
      ? animations.find((a) => a.id === playbackState.currentAnimationId)?.frameIds.length || frames.length
      : frames.length

    if (playerRef.current) {
      playerRef.current.nextFrame(totalFrames)
    }
  }

  const handlePreviousFrame = () => {
    const totalFrames = playbackState.currentAnimationId
      ? animations.find((a) => a.id === playbackState.currentAnimationId)?.frameIds.length || frames.length
      : frames.length

    if (playerRef.current) {
      playerRef.current.previousFrame(totalFrames)
    }
  }

  const handleFrameSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value)
    if (playerRef.current) {
      playerRef.current.goToFrame(index)
    }
  }

  const handleFpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fps = parseInt(e.target.value)
    if (playerRef.current) {
      playerRef.current.setFps(fps)
      setPlaybackState((prev) => ({ ...prev, fps }))
    }
  }

  const handleAnimationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const animationId = e.target.value || null
    if (playerRef.current) {
      playerRef.current.setAnimation(animationId)
      setPlaybackState((prev) => ({ ...prev, currentAnimationId: animationId }))
    }
  }

  const handleToggleOnionSkin = () => {
    setPlaybackState((prev) => ({ ...prev, onionSkinEnabled: !prev.onionSkinEnabled }))
  }

  const handleOnionSkinOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackState((prev) => ({ ...prev, onionSkinOpacity: parseFloat(e.target.value) }))
  }

  const handleToggleMarkers = () => {
    setPlaybackState((prev) => ({ ...prev, showMarkers: !prev.showMarkers }))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.max(0.1, Math.min(5, prev * delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const currentAnimationFrames = playbackState.currentAnimationId
    ? animations.find((a) => a.id === playbackState.currentAnimationId)?.frameIds.length || 0
    : frames.length

  return (
    <div className="preview-panel">
      <div className="preview-panel__header">
        <h2>Preview</h2>
        <div className="preview-panel__stats">
          <span>{frames.length} frames</span>
          {animations.length > 0 && <span>{animations.length} animations</span>}
        </div>
      </div>

      <div className="preview-panel__canvas-container" ref={containerRef}>
        {currentFrame ? (
          <canvas
            ref={canvasRef}
            className="preview-panel__canvas"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        ) : (
          <div className="preview-panel__placeholder">
            <p>No frames to preview</p>
          </div>
        )}
      </div>

      <div className="preview-panel__controls">
        <div className="preview-panel__playback-controls">
          <button
            className="preview-panel__control-btn"
            onClick={handlePreviousFrame}
            disabled={!currentFrame}
            title="Previous frame"
          >
            ⏮
          </button>
          <button
            className="preview-panel__control-btn preview-panel__play-btn"
            onClick={handlePlayPause}
            disabled={!currentFrame}
            title={playbackState.isPlaying ? 'Pause' : 'Play'}
          >
            {playbackState.isPlaying ? '⏸' : '▶'}
          </button>
          <button
            className="preview-panel__control-btn"
            onClick={handleStop}
            disabled={!currentFrame}
            title="Stop"
          >
            ⏹
          </button>
          <button
            className="preview-panel__control-btn"
            onClick={handleNextFrame}
            disabled={!currentFrame}
            title="Next frame"
          >
            ⏭
          </button>
        </div>

        <div className="preview-panel__timeline">
          <input
            type="range"
            min="0"
            max={Math.max(0, currentAnimationFrames - 1)}
            value={playbackState.currentFrameIndex}
            onChange={handleFrameSliderChange}
            disabled={!currentFrame}
            className="preview-panel__timeline-slider"
          />
          <span className="preview-panel__frame-counter">
            {playbackState.currentFrameIndex + 1} / {currentAnimationFrames}
          </span>
        </div>

        <div className="preview-panel__settings">
          <div className="preview-panel__setting">
            <label htmlFor="fps-input">FPS:</label>
            <input
              id="fps-input"
              type="number"
              min="1"
              max="60"
              value={playbackState.fps}
              onChange={handleFpsChange}
              className="preview-panel__fps-input"
            />
          </div>

          {animations.length > 0 && (
            <div className="preview-panel__setting">
              <label htmlFor="animation-select">Animation:</label>
              <select
                id="animation-select"
                value={playbackState.currentAnimationId || ''}
                onChange={handleAnimationChange}
                className="preview-panel__animation-select"
              >
                <option value="">All Frames</option>
                {animations.map((anim) => (
                  <option key={anim.id} value={anim.id}>
                    {anim.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="preview-panel__setting">
            <button
              className={`preview-panel__toggle-btn ${playbackState.onionSkinEnabled ? 'active' : ''}`}
              onClick={handleToggleOnionSkin}
              title="Toggle onion skin"
            >
              Onion Skin
            </button>
          </div>

          {playbackState.onionSkinEnabled && (
            <div className="preview-panel__setting">
              <label htmlFor="onion-opacity">Opacity:</label>
              <input
                id="onion-opacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={playbackState.onionSkinOpacity}
                onChange={handleOnionSkinOpacityChange}
                className="preview-panel__opacity-slider"
              />
            </div>
          )}

          <div className="preview-panel__setting">
            <button
              className={`preview-panel__toggle-btn ${playbackState.showMarkers ? 'active' : ''}`}
              onClick={handleToggleMarkers}
              title="Toggle skeletal markers"
            >
              Markers
            </button>
          </div>
        </div>
      </div>

      <div className="preview-panel__info">
        <p className="preview-panel__info-text">
          Scroll to zoom • Alt+drag to pan • Use controls to navigate frames
        </p>
      </div>
    </div>
  )
}
