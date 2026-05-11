import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvasInteraction } from '../useCanvasInteraction'

describe('useCanvasInteraction', () => {
  let containerRef: { current: HTMLDivElement | null }
  let mockElement: HTMLDivElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    Object.defineProperty(mockElement, 'getBoundingClientRect', {
      value: () => ({ width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600, x: 0, y: 0 }),
      writable: false,
    })
    Object.defineProperty(mockElement, 'style', {
      value: {},
      writable: true,
      configurable: true,
    })
    containerRef = { current: mockElement }
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    if (containerRef.current) {
      document.body.removeChild(containerRef.current)
    }
  })

  const createWheelEvent = (deltaY: number, clientX: number, clientY: number) => {
    return {
      deltaY,
      clientX,
      clientY,
      currentTarget: mockElement,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any
  }

  const createMouseEvent = (
    button: number,
    clientX: number,
    clientY: number,
    altKey: boolean = false
  ) => {
    return {
      button,
      clientX,
      clientY,
      altKey,
      currentTarget: mockElement,
      preventDefault: vi.fn(),
    } as any
  }

  describe('initial state', () => {
    it('should initialize with default transform', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      expect(result.current.transform).toEqual({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      })
    })

    it('should use custom options when provided', () => {
      const onTransformChange = vi.fn()
      const { result } = renderHook(() =>
        useCanvasInteraction(containerRef, {
          minScale: 0.5,
          maxScale: 5,
          wheelSensitivity: 0.002,
          onTransformChange,
        })
      )

      expect(result.current.transform).toEqual({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      })
    })
  })

  describe('wheel zoom', () => {
    it('should zoom in on wheel up (negative deltaY)', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.handlers.handleWheel(createWheelEvent(-100, 400, 300))
      })

      expect(result.current.transform.scale).toBeGreaterThan(1)
    })

    it('should zoom out on wheel down (positive deltaY)', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.handlers.handleWheel(createWheelEvent(100, 400, 300))
      })

      expect(result.current.transform.scale).toBeLessThan(1)
    })

    it('should respect minScale limit', () => {
      const { result } = renderHook(() =>
        useCanvasInteraction(containerRef, { minScale: 0.5 })
      )

      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.handlers.handleWheel(createWheelEvent(1000, 400, 300))
        })
      }

      expect(result.current.transform.scale).toBeGreaterThanOrEqual(0.5)
    })

    it('should respect maxScale limit', () => {
      const { result } = renderHook(() =>
        useCanvasInteraction(containerRef, { maxScale: 3 })
      )

      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.handlers.handleWheel(createWheelEvent(-1000, 400, 300))
        })
      }

      expect(result.current.transform.scale).toBeLessThanOrEqual(3)
    })

    it('should call onTransformChange callback', () => {
      const onTransformChange = vi.fn()
      const { result } = renderHook(() =>
        useCanvasInteraction(containerRef, { onTransformChange })
      )

      act(() => {
        result.current.handlers.handleWheel(createWheelEvent(-100, 400, 300))
      })

      expect(onTransformChange).toHaveBeenCalled()
    })
  })

  describe('pan operations', () => {
    it('should start panning on Alt+left mouse down', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.handlers.handleMouseDown(createMouseEvent(0, 100, 100, true))
      })

      act(() => {
        result.current.handlers.handleMouseMove(createMouseEvent(0, 150, 150))
      })

      expect(result.current.transform.offsetX).not.toBe(0)
      expect(result.current.transform.offsetY).not.toBe(0)
    })

    it('should start panning on middle mouse button', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.handlers.handleMouseDown(createMouseEvent(1, 100, 100))
      })

      act(() => {
        result.current.handlers.handleMouseMove(createMouseEvent(1, 120, 120))
      })

      expect(result.current.transform.offsetX).toBe(20)
      expect(result.current.transform.offsetY).toBe(20)
    })

    it('should not pan on left mouse without Alt key', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))
      const initialTransform = result.current.transform

      act(() => {
        result.current.handlers.handleMouseDown(createMouseEvent(0, 100, 100, false))
      })

      act(() => {
        result.current.handlers.handleMouseMove(createMouseEvent(0, 150, 150))
      })

      expect(result.current.transform).toEqual(initialTransform)
    })

    it('should stop panning on mouse up', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.handlers.handleMouseDown(createMouseEvent(1, 100, 100))
      })

      act(() => {
        result.current.handlers.handleMouseMove(createMouseEvent(1, 150, 150))
      })

      const transformDuringPan = result.current.transform

      act(() => {
        result.current.handlers.handleMouseUp()
      })

      act(() => {
        result.current.handlers.handleMouseMove(createMouseEvent(1, 200, 200))
      })

      expect(result.current.transform).toEqual(transformDuringPan)
    })
  })

  describe('reset and fit operations', () => {
    it('should reset transform to default on double click', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.handlers.handleWheel(createWheelEvent(-100, 400, 300))
      })

      expect(result.current.transform.scale).not.toBe(1)

      act(() => {
        result.current.handlers.handleDoubleClick()
      })

      expect(result.current.transform).toEqual({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      })
    })

    it('should reset transform when calling resetTransform', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.handlers.handleWheel(createWheelEvent(-100, 400, 300))
      })

      act(() => {
        result.current.resetTransform()
      })

      expect(result.current.transform).toEqual({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      })
    })

    it('should fit content to view', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.fitToView(400, 300)
      })

      const { scale, offsetX, offsetY } = result.current.transform

      expect(scale).toBeGreaterThan(0)
      expect(scale).toBeLessThanOrEqual(1)
      expect(offsetX).toBeGreaterThanOrEqual(0)
      expect(offsetY).toBeGreaterThanOrEqual(0)
    })
  })

  describe('setScale', () => {
    it('should set scale directly', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.setScale(2.5)
      })

      expect(result.current.transform.scale).toBe(2.5)
    })

    it('should preserve offset when setting scale', () => {
      const { result } = renderHook(() => useCanvasInteraction(containerRef))

      act(() => {
        result.current.fitToView(400, 300)
      })

      const originalOffsetX = result.current.transform.offsetX
      const originalOffsetY = result.current.transform.offsetY

      act(() => {
        result.current.setScale(2)
      })

      expect(result.current.transform.offsetX).toBe(originalOffsetX)
      expect(result.current.transform.offsetY).toBe(originalOffsetY)
    })
  })

  describe('disabled interactions', () => {
    it('should not zoom when enableZoom is false', () => {
      const { result } = renderHook(() =>
        useCanvasInteraction(containerRef, { enableZoom: false })
      )

      act(() => {
        result.current.handlers.handleWheel(createWheelEvent(-100, 400, 300))
      })

      expect(result.current.transform.scale).toBe(1)
    })

    it('should not pan when enablePan is false', () => {
      const { result } = renderHook(() =>
        useCanvasInteraction(containerRef, { enablePan: false })
      )

      act(() => {
        result.current.handlers.handleMouseDown(createMouseEvent(1, 100, 100))
      })

      act(() => {
        result.current.handlers.handleMouseMove(createMouseEvent(1, 150, 150))
      })

      expect(result.current.transform.offsetX).toBe(0)
      expect(result.current.transform.offsetY).toBe(0)
    })
  })
})
