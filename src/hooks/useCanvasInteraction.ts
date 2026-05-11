import { useRef, useCallback, useEffect, useState } from 'react'

export interface CanvasTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface CanvasInteractionOptions {
  minScale?: number
  maxScale?: number
  wheelSensitivity?: number
  enablePan?: boolean
  enableZoom?: boolean
  onTransformChange?: (transform: CanvasTransform) => void
}

export interface CanvasInteractionHandlers {
  handleWheel: (e: React.WheelEvent) => void
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
  handleDoubleClick: () => void
}

const DEFAULT_OPTIONS: Required<CanvasInteractionOptions> = {
  minScale: 0.1,
  maxScale: 10,
  wheelSensitivity: 0.001,
  enablePan: true,
  enableZoom: true,
  onTransformChange: () => {},
}

export function useCanvasInteraction(
  containerRef: React.RefObject<HTMLElement>,
  options: CanvasInteractionOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const transformRef = useRef<CanvasTransform>({ scale: 1, offsetX: 0, offsetY: 0 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const transformStartRef = useRef({ offsetX: 0, offsetY: 0 })

  const [transform, setTransform] = useState<CanvasTransform>(transformRef.current)

  const updateTransform = useCallback((newTransform: CanvasTransform) => {
    transformRef.current = newTransform
    setTransform(newTransform)
    opts.onTransformChange(newTransform)
  }, [opts.onTransformChange])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!opts.enableZoom) return

    e.preventDefault()
    e.stopPropagation()

    const delta = -e.deltaY * opts.wheelSensitivity
    const newScale = Math.min(
      opts.maxScale,
      Math.max(opts.minScale, transformRef.current.scale * (1 + delta))
    )

    if (newScale === transformRef.current.scale) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const scaleChange = newScale / transformRef.current.scale
    const newOffsetX = mouseX - (mouseX - transformRef.current.offsetX) * scaleChange
    const newOffsetY = mouseY - (mouseY - transformRef.current.offsetY) * scaleChange

    updateTransform({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    })
  }, [opts.enableZoom, opts.enableZoom, opts.minScale, opts.maxScale, opts.wheelSensitivity, updateTransform])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!opts.enablePan) return
    if (e.button !== 1 && !(e.button === 0 && e.altKey)) return

    e.preventDefault()
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    transformStartRef.current = {
      offsetX: transformRef.current.offsetX,
      offsetY: transformRef.current.offsetY,
    }

    ;(e.currentTarget as HTMLElement).style.cursor = 'grabbing'
  }, [opts.enablePan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !opts.enablePan) return

    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    updateTransform({
      ...transformRef.current,
      offsetX: transformStartRef.current.offsetX + dx,
      offsetY: transformStartRef.current.offsetY + dy,
    })
  }, [opts.enablePan, updateTransform])

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      const container = containerRef.current
      if (container) {
        container.style.cursor = ''
      }
    }
  }, [containerRef])

  const handleDoubleClick = useCallback(() => {
    updateTransform({ scale: 1, offsetX: 0, offsetY: 0 })
  }, [updateTransform])

  const fitToView = useCallback((contentWidth: number, contentHeight: number) => {
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const scale = Math.min(scaleX, scaleY, 1) * 0.9

    const offsetX = (containerWidth - contentWidth * scale) / 2
    const offsetY = (containerHeight - contentHeight * scale) / 2

    updateTransform({ scale, offsetX, offsetY })
  }, [containerRef, updateTransform])

  const resetTransform = useCallback(() => {
    updateTransform({ scale: 1, offsetX: 0, offsetY: 0 })
  }, [updateTransform])

  const setScale = useCallback((scale: number) => {
    updateTransform({ ...transformRef.current, scale })
  }, [updateTransform])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        const container = containerRef.current
        if (container) {
          container.style.cursor = ''
        }
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [containerRef])

  return {
    transform,
    handlers: {
      handleWheel,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleDoubleClick,
    },
    fitToView,
    resetTransform,
    setScale,
  }
}
