import type { Rect } from '../types'

export async function loadImageFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      URL.revokeObjectURL(url)
      resolve(imageData)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function imageDataToDataURL(data: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL()
}

export function cropImageData(data: ImageData, rect: Rect): ImageData {
  const { x, y, width, height } = rect

  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    throw new Error('Invalid crop rectangle')
  }

  if (x + width > data.width || y + height > data.height) {
    throw new Error('Crop rectangle exceeds image bounds')
  }

  const cropped = new ImageData(width, height)
  const src = data.data
  const dst = cropped.data

  for (let row = 0; row < height; row++) {
    const srcOffset = ((y + row) * data.width + x) * 4
    const dstOffset = row * width * 4
    dst.set(src.subarray(srcOffset, srcOffset + width * 4), dstOffset)
  }

  return cropped
}

export function getAlphaChannel(data: ImageData): Uint8Array {
  const alpha = new Uint8Array(data.width * data.height)
  for (let i = 0; i < data.width * data.height; i++) {
    alpha[i] = data.data[i * 4 + 3]
  }
  return alpha
}

export function drawImageDataToCanvas(canvas: HTMLCanvasElement, data: ImageData): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  canvas.width = data.width
  canvas.height = data.height
  ctx.putImageData(data, 0, 0)
}
