import { describe, it, expect, vi } from 'vitest'
import { bundleExportZip, bundleFrameImagesZip } from '../zipBundler'
import type { Frame, SpriteSheetSource } from '../../../types/frame'
import type { AsepriteFile } from '../../../types/aseprite'

describe('ZIP bundler', () => {
  const mockSource: SpriteSheetSource = {
    imageData: new ImageData(
      new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
      1,
      2
    ),
    width: 1,
    height: 2,
    fileName: 'test.png',
  }

  const mockFrames: Frame[] = [
    {
      id: 'frame-1',
      region: {
        rect: { x: 0, y: 0, width: 32, height: 32 },
        sourceIndex: 0,
      },
      durationMs: 100,
    },
  ]

  const mockAsepriteJson: AsepriteFile = {
    frames: {
      'idle_0000.png': {
        frame: { x: 0, y: 0, w: 32, h: 32 },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
        sourceSize: { w: 32, h: 32 },
        duration: 100,
      },
    },
    meta: {
      format: 'RGBA8888',
      size: { w: 256, h: 256 },
      scale: '1',
      frameTags: [],
      layers: [],
      slices: [],
    },
  }

  describe('bundleExportZip', () => {
    it('should call progress callback with preparing stage', async () => {
      const onProgress = vi.fn()

      await bundleExportZip({
        sourceImage: mockSource,
        frames: mockFrames,
        asepriteJson: mockAsepriteJson,
        outputFileName: 'test',
        onProgress,
      })

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'preparing',
        })
      )
    })

    it('should call progress callback with packaging stage', async () => {
      const onProgress = vi.fn()

      await bundleExportZip({
        sourceImage: mockSource,
        frames: mockFrames,
        asepriteJson: mockAsepriteJson,
        outputFileName: 'test',
        onProgress,
      })

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'packaging',
        })
      )
    })

    it('should call progress callback with complete stage', async () => {
      const onProgress = vi.fn()

      await bundleExportZip({
        sourceImage: mockSource,
        frames: mockFrames,
        asepriteJson: mockAsepriteJson,
        outputFileName: 'test',
        onProgress,
      })

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'complete',
          currentFrame: 1,
          totalFrames: 1,
        })
      )
    })

    it('should return a Blob', async () => {
      const result = await bundleExportZip({
        sourceImage: mockSource,
        frames: mockFrames,
        asepriteJson: mockAsepriteJson,
        outputFileName: 'test',
      })

      expect(result).toBeInstanceOf(Blob)
    })

    it('should handle empty frames array', async () => {
      const onProgress = vi.fn()

      const result = await bundleExportZip({
        sourceImage: mockSource,
        frames: [],
        asepriteJson: { frames: {}, meta: mockAsepriteJson.meta },
        outputFileName: 'test',
        onProgress,
      })

      expect(result).toBeInstanceOf(Blob)
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentFrame: 0,
          totalFrames: 0,
        })
      )
    })

    it('should work without progress callback', async () => {
      const result = await bundleExportZip({
        sourceImage: mockSource,
        frames: mockFrames,
        asepriteJson: mockAsepriteJson,
        outputFileName: 'test',
      })

      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('bundleFrameImagesZip', () => {
    it('should call progress callback with rendering stage', async () => {
      const onProgress = vi.fn()

      await bundleFrameImagesZip(mockFrames, mockSource, onProgress)

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'rendering',
        })
      )
    })

    it('should return a Blob', async () => {
      const result = await bundleFrameImagesZip(mockFrames, mockSource)

      expect(result).toBeInstanceOf(Blob)
    })

    it('should handle empty frames array', async () => {
      const onProgress = vi.fn()

      const result = await bundleFrameImagesZip([], mockSource, onProgress)

      expect(result).toBeInstanceOf(Blob)
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentFrame: 0,
          totalFrames: 0,
        })
      )
    })
  })
})
