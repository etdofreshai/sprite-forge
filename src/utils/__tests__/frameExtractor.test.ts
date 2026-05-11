import { describe, it, expect } from 'vitest'
import { extractFrames, type FrameExtractionProgress } from '../frameExtractor'

describe('frameExtractor', () => {
  const createMockImageData = (width: number, height: number): ImageData => {
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128
      data[i + 1] = 64
      data[i + 2] = 32
      data[i + 3] = 255
    }
    return {
      data,
      width,
      height,
      colorSpace: 'srgb',
    } as ImageData
  }

  describe('extractFrames', () => {
    it('should extract frames from source ImageData', () => {
      const source = createMockImageData(100, 100)
      const regions = [
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 },
        { x: 0, y: 10, width: 10, height: 10 },
      ]

      const frames = extractFrames(source, regions)

      expect(frames).toHaveLength(3)
      expect(frames[0].id).toBe('frame-0-0')
      expect(frames[1].id).toBe('frame-0-1')
      expect(frames[2].id).toBe('frame-0-2')
    })

    it('should assign correct metadata to extracted frames', () => {
      const source = createMockImageData(100, 100)
      const regions = [{ x: 5, y: 5, width: 20, height: 30 }]

      const frames = extractFrames(source, regions, undefined, 2)

      expect(frames[0].sourceIndex).toBe(2)
      expect(frames[0].rect).toEqual({ x: 5, y: 5, width: 20, height: 30 })
      expect(frames[0].imageData.width).toBe(20)
      expect(frames[0].imageData.height).toBe(30)
    })

    it('should call progress callback for each frame', () => {
      const source = createMockImageData(100, 100)
      const regions = [
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 },
      ]

      const progressUpdates: FrameExtractionProgress[] = []
      const onProgress = (progress: FrameExtractionProgress) => {
        progressUpdates.push(progress)
      }

      extractFrames(source, regions, onProgress)

      expect(progressUpdates).toHaveLength(2)
      expect(progressUpdates[0].current).toBe(1)
      expect(progressUpdates[0].total).toBe(2)
      expect(progressUpdates[0].frame).toBeDefined()

      expect(progressUpdates[1].current).toBe(2)
      expect(progressUpdates[1].total).toBe(2)
      expect(progressUpdates[1].frame).toBeDefined()
    })

    it('should work without progress callback', () => {
      const source = createMockImageData(100, 100)
      const regions = [{ x: 0, y: 0, width: 10, height: 10 }]

      expect(() => extractFrames(source, regions)).not.toThrow()
    })

    it('should generate unique frame IDs', () => {
      const source = createMockImageData(100, 100)
      const regions = [
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 },
        { x: 20, y: 0, width: 10, height: 10 },
      ]

      const frames = extractFrames(source, regions)
      const ids = frames.map((f) => f.id)

      expect(new Set(ids).size).toBe(3)
    })

    it('should use default sourceIndex of 0', () => {
      const source = createMockImageData(100, 100)
      const regions = [{ x: 0, y: 0, width: 10, height: 10 }]

      const frames = extractFrames(source, regions)

      expect(frames[0].sourceIndex).toBe(0)
    })

    it('should handle empty regions array', () => {
      const source = createMockImageData(100, 100)
      const regions: any[] = []

      const frames = extractFrames(source, regions)

      expect(frames).toHaveLength(0)
    })
  })
})
