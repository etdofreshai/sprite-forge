import { describe, it, expect } from 'vitest'
import { cropImageData, getAlphaChannel } from '../image'

describe('image utils', () => {
  describe('cropImageData', () => {
    const createMockImageData = (width: number, height: number): ImageData => {
      const data = new Uint8ClampedArray(width * height * 4)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255
        data[i + 1] = 0
        data[i + 2] = 0
        data[i + 3] = 255
      }
      return {
        data,
        width,
        height,
        colorSpace: 'srgb',
      } as ImageData
    }

    it('should crop ImageData to specified rectangle', () => {
      const imageData = createMockImageData(100, 100)
      const cropped = cropImageData(imageData, { x: 10, y: 10, width: 20, height: 20 })

      expect(cropped.width).toBe(20)
      expect(cropped.height).toBe(20)
      expect(cropped.data.length).toBe(20 * 20 * 4)
    })

    it('should throw error for negative coordinates', () => {
      const imageData = createMockImageData(100, 100)
      expect(() => cropImageData(imageData, { x: -1, y: 0, width: 10, height: 10 })).toThrow(
        'Invalid crop rectangle',
      )
    })

    it('should throw error for rectangle exceeding bounds', () => {
      const imageData = createMockImageData(100, 100)
      expect(() => cropImageData(imageData, { x: 90, y: 90, width: 20, height: 20 })).toThrow(
        'Crop rectangle exceeds image bounds',
      )
    })

    it('should preserve pixel data correctly', () => {
      const imageData = createMockImageData(10, 10)
      const cropped = cropImageData(imageData, { x: 2, y: 3, width: 5, height: 4 })

      expect(cropped.width).toBe(5)
      expect(cropped.height).toBe(4)
      expect(cropped.data[0]).toBe(255)
      expect(cropped.data[3]).toBe(255)
    })
  })

  describe('getAlphaChannel', () => {
    it('should extract alpha channel from ImageData', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 100, 0, 255, 0, 150, 0, 0, 255, 200, 255, 255, 255, 255,
      ])
      const imageData = { data, width: 2, height: 2, colorSpace: 'srgb' } as ImageData

      const alpha = getAlphaChannel(imageData)

      expect(alpha).toHaveLength(4)
      expect(alpha[0]).toBe(100)
      expect(alpha[1]).toBe(150)
      expect(alpha[2]).toBe(200)
      expect(alpha[3]).toBe(255)
    })

    it('should handle larger images', () => {
      const size = 10
      const data = new Uint8ClampedArray(size * size * 4)
      for (let i = 0; i < data.length; i += 4) {
        data[i + 3] = 128
      }
      const imageData = { data, width: size, height: size, colorSpace: 'srgb' } as ImageData

      const alpha = getAlphaChannel(imageData)

      expect(alpha).toHaveLength(size * size)
      expect(alpha.every((v) => v === 128)).toBe(true)
    })
  })
})
