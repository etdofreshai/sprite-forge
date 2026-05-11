import { describe, it, expect, vi } from 'vitest'
import {
  renderAlignmentPreview,
  hitTestMarker,
  initializeDefaultMarkers,
  MARKER_CONFIGS,
  type AlignmentPreviewState,
  type MarkerName,
} from '../alignmentPreview'
import type { SkeletalMarkers } from '../../../types'

describe('alignmentPreview', () => {
  const mockMarkers: SkeletalMarkers = {
    pelvis: { x: 50, y: 60 },
    head: { x: 50, y: 25 },
    leftHand: { x: 25, y: 50 },
    rightHand: { x: 75, y: 50 },
    leftFoot: { x: 35, y: 90 },
    rightFoot: { x: 65, y: 90 },
  }

  const createMockContextWithMethods = (): CanvasRenderingContext2D => {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      clearRect: vi.fn(),
      putImageData: vi.fn(),
      drawImage: vi.fn(),
      createImageData: vi.fn(() => new ImageData(10, 10)),
      getImageData: vi.fn(() => new ImageData(10, 10)),
      measureText: vi.fn(() => ({ width: 10 })),
      setLineDash: vi.fn(),
      getLineDash: vi.fn(() => []),
      lineDashOffset: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      direction: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      shadowBlur: 0,
      shadowColor: '',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      filter: 'none',
      canvas: document.createElement('canvas'),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      translate: vi.fn(),
      createLinearGradient: vi.fn(),
      createRadialGradient: vi.fn(),
      createPattern: vi.fn(),
      clip: vi.fn(),
      isPointInPath: vi.fn(() => false),
      isPointInStroke: vi.fn(() => false),
      drawFocusIfNeeded: vi.fn(),
      scrollPathIntoView: vi.fn(),
      roundRect: vi.fn(),
    } as any
  }

  describe('MARKER_CONFIGS', () => {
    it('should have all marker names', () => {
      const markerNames: MarkerName[] = ['pelvis', 'head', 'leftHand', 'rightHand', 'leftFoot', 'rightFoot']
      expect(Object.keys(MARKER_CONFIGS)).toEqual(expect.arrayContaining(markerNames))
    })

    it('should have required config properties', () => {
      for (const config of Object.values(MARKER_CONFIGS)) {
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('color')
        expect(config).toHaveProperty('defaultPosition')
        expect(typeof config.defaultPosition).toBe('function')
      }
    })
  })

  describe('renderAlignmentPreview', () => {
    it('should render markers without errors', () => {
      const ctx = createMockContextWithMethods()
      const state: AlignmentPreviewState = {
        selectedMarker: null,
        isEditing: false,
        showLabels: true,
        showConnections: true,
      }

      expect(() => {
        renderAlignmentPreview(mockMarkers, ctx, state, 1)
      }).not.toThrow()
    })

    it('should render with selected marker', () => {
      const ctx = createMockContextWithMethods()
      const state: AlignmentPreviewState = {
        selectedMarker: 'head',
        isEditing: false,
        showLabels: true,
        showConnections: true,
      }

      expect(() => {
        renderAlignmentPreview(mockMarkers, ctx, state, 1)
      }).not.toThrow()
    })

    it('should render without connections when disabled', () => {
      const ctx = createMockContextWithMethods()
      const state: AlignmentPreviewState = {
        selectedMarker: null,
        isEditing: false,
        showLabels: true,
        showConnections: false,
      }

      expect(() => {
        renderAlignmentPreview(mockMarkers, ctx, state, 1)
      }).not.toThrow()
    })
  })

  describe('hitTestMarker', () => {
    it('should return marker name when hitting a marker', () => {
      const result = hitTestMarker(50, 25, mockMarkers, 1, 15)
      expect(result).toBe('head')
    })

    it('should return null when missing all markers', () => {
      const result = hitTestMarker(0, 0, mockMarkers, 1, 15)
      expect(result).toBeNull()
    })

    it('should account for scale in hit testing', () => {
      const result = hitTestMarker(100, 50, mockMarkers, 2, 15)
      expect(result).toBe('head')
    })

    it('should use custom hit radius', () => {
      const result = hitTestMarker(50, 30, mockMarkers, 1, 10)
      expect(result).toBe('head')
    })
  })

  describe('initializeDefaultMarkers', () => {
    it('should create markers with all required properties', () => {
      const markers = initializeDefaultMarkers(100, 100)

      expect(markers).toHaveProperty('pelvis')
      expect(markers).toHaveProperty('head')
      expect(markers).toHaveProperty('leftHand')
      expect(markers).toHaveProperty('rightHand')
      expect(markers).toHaveProperty('leftFoot')
      expect(markers).toHaveProperty('rightFoot')
    })

    it('should position markers within frame bounds', () => {
      const frameWidth = 100
      const frameHeight = 100
      const markers = initializeDefaultMarkers(frameWidth, frameHeight)

      for (const point of Object.values(markers)) {
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.x).toBeLessThanOrEqual(frameWidth)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeLessThanOrEqual(frameHeight)
      }
    })

    it('should scale positions with frame size', () => {
      const smallMarkers = initializeDefaultMarkers(50, 50)
      const largeMarkers = initializeDefaultMarkers(200, 200)

      expect(smallMarkers.head.x).toBeLessThan(largeMarkers.head.x)
      expect(smallMarkers.head.y).toBeLessThan(largeMarkers.head.y)
    })

    it('should position pelvis in lower middle', () => {
      const markers = initializeDefaultMarkers(100, 100)
      expect(markers.pelvis.x).toBeCloseTo(50, 0)
      expect(markers.pelvis.y).toBeCloseTo(60, 0)
    })

    it('should position head in upper middle', () => {
      const markers = initializeDefaultMarkers(100, 100)
      expect(markers.head.x).toBeCloseTo(50, 0)
      expect(markers.head.y).toBeCloseTo(25, 0)
    })
  })
})
