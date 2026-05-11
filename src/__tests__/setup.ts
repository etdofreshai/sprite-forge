import '@testing-library/jest-dom'
import { vi } from 'vitest'

class MockImageData implements ImageData {
  data: Uint8ClampedArray
  width: number
  height: number
  colorSpace: PredefinedColorSpace

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.data = new Uint8ClampedArray(width * height * 4)
    this.colorSpace = 'srgb'
  }
}

;(globalThis as any).ImageData = MockImageData

HTMLCanvasElement.prototype.getContext = vi.fn(((_contextType: string) => {
  return {
    getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => new MockImageData(w, h)),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
    canvas: { width: 0, height: 0 },
  }
}) as any) as any

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
