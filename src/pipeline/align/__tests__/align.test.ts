import { describe, it, expect } from 'vitest'
import { computeAlignment, applyAlignment, computeCommonCanvasSize } from '../index'
import type { Frame } from '../../../types'

describe('Alignment engine', () => {
  describe('computeAlignment', () => {
    it('should compute offsets to align pelvis Y values to common Y (max)', () => {
      const frames: Frame[] = [
        { id: '1', region: { rect: { x: 0, y: 0, width: 64, height: 64 }, sourceIndex: 0 }, durationMs: 100 },
        { id: '2', region: { rect: { x: 0, y: 0, width: 64, height: 64 }, sourceIndex: 0 }, durationMs: 100 },
        { id: '3', region: { rect: { x: 0, y: 0, width: 64, height: 64 }, sourceIndex: 0 }, durationMs: 100 },
      ]

      const markers = [
        { x: 32, y: 20 },
        { x: 32, y: 25 },
        { x: 32, y: 30 },
      ]

      const offsets = computeAlignment(frames, markers)

      expect(offsets).toEqual([10, 5, 0])
    })

    it('should return empty array for empty frames', () => {
      const offsets = computeAlignment([], [])
      expect(offsets).toEqual([])
    })

    it('should throw if frame count does not match marker count', () => {
      const frames: Frame[] = [
        { id: '1', region: { rect: { x: 0, y: 0, width: 64, height: 64 }, sourceIndex: 0 }, durationMs: 100 },
      ]
      const markers = [
        { x: 32, y: 20 },
        { x: 32, y: 25 },
      ]

      expect(() => computeAlignment(frames, markers)).toThrow()
    })
  })

  describe('applyAlignment', () => {
    it('should apply Y offset to frame region', () => {
      const frame: Frame = {
        id: '1',
        region: { rect: { x: 10, y: 20, width: 64, height: 64 }, sourceIndex: 0 },
        durationMs: 100,
      }

      const aligned = applyAlignment(frame, 15)

      expect(aligned.region.rect.y).toBe(35)
      expect(aligned.region.rect.x).toBe(10)
      expect(aligned.region.rect.width).toBe(64)
      expect(aligned.region.rect.height).toBe(64)
    })

    it('should return new frame object without mutating original', () => {
      const frame: Frame = {
        id: '1',
        region: { rect: { x: 10, y: 20, width: 64, height: 64 }, sourceIndex: 0 },
        durationMs: 100,
      }

      const originalY = frame.region.rect.y
      applyAlignment(frame, 15)

      expect(frame.region.rect.y).toBe(originalY)
    })
  })

  describe('computeCommonCanvasSize', () => {
    it('should compute minimum canvas size containing all aligned frames', () => {
      const frames: Frame[] = [
        { id: '1', region: { rect: { x: 0, y: 0, width: 50, height: 60 }, sourceIndex: 0 }, durationMs: 100 },
        { id: '2', region: { rect: { x: 0, y: 0, width: 40, height: 70 }, sourceIndex: 0 }, durationMs: 100 },
        { id: '3', region: { rect: { x: 0, y: 0, width: 60, height: 50 }, sourceIndex: 0 }, durationMs: 100 },
      ]

      const offsets = [10, 5, 0]

      const size = computeCommonCanvasSize(frames, offsets)

      expect(size.width).toBe(60)
      expect(size.height).toBe(75)
    })

    it('should return zero size for empty inputs', () => {
      const size = computeCommonCanvasSize([], [])
      expect(size).toEqual({ width: 0, height: 0 })
    })

    it('should throw if frame count does not match offset count', () => {
      const frames: Frame[] = [
        { id: '1', region: { rect: { x: 0, y: 0, width: 64, height: 64 }, sourceIndex: 0 }, durationMs: 100 },
      ]
      const offsets = [1, 2]

      expect(() => computeCommonCanvasSize(frames, offsets)).toThrow()
    })
  })
})
