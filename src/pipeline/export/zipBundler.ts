import JSZip from 'jszip'
import type { ExportProgress } from '../../types/export'
import type { Frame, SpriteSheetSource } from '../../types/frame'
import type { AsepriteFile } from '../../types/aseprite'

export interface BundleOptions {
  sourceImage: SpriteSheetSource
  frames: Frame[]
  asepriteJson: AsepriteFile
  outputFileName: string
  onProgress?: (progress: ExportProgress) => void
}

export async function bundleExportZip(options: BundleOptions): Promise<Blob> {
  const { sourceImage, frames, asepriteJson, outputFileName, onProgress } = options

  onProgress?.({
    currentFrame: 0,
    totalFrames: frames.length,
    currentAnimation: 0,
    totalAnimations: 1,
    stage: 'preparing',
  })

  const zip = new JSZip()

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  canvas.width = sourceImage.width
  canvas.height = sourceImage.height
  ctx.putImageData(sourceImage.imageData, 0, 0)

  const pngDataUrl = canvas.toDataURL('image/png')
  const pngBase64 = pngDataUrl.split(',')[1]
  const pngBinary = atob(pngBase64)
  const pngArray = new Uint8Array(pngBinary.length)

  for (let i = 0; i < pngBinary.length; i++) {
    pngArray[i] = pngBinary.charCodeAt(i)
  }

  zip.file(`${outputFileName}.png`, pngArray)

  onProgress?.({
    currentFrame: 0,
    totalFrames: frames.length,
    currentAnimation: 0,
    totalAnimations: 1,
    stage: 'packaging',
  })

  const jsonString = JSON.stringify(asepriteJson, null, 2)
  zip.file(`${outputFileName}.json`, jsonString)

  onProgress?.({
    currentFrame: frames.length,
    totalFrames: frames.length,
    currentAnimation: 1,
    totalAnimations: 1,
    stage: 'complete',
  })

  return await zip.generateAsync({ type: 'blob' })
}

export async function bundleFrameImagesZip(
  frames: Frame[],
  sourceImage: SpriteSheetSource,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const zip = new JSZip()

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  canvas.width = sourceImage.width
  canvas.height = sourceImage.height
  ctx.putImageData(sourceImage.imageData, 0, 0)

  onProgress?.({
    currentFrame: 0,
    totalFrames: frames.length,
    currentAnimation: 0,
    totalAnimations: 1,
    stage: 'rendering',
  })

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const { rect } = frame.region

    const frameCanvas = document.createElement('canvas')
    frameCanvas.width = rect.width
    frameCanvas.height = rect.height
    const frameCtx = frameCanvas.getContext('2d')

    if (!frameCtx) {
      throw new Error('Failed to get frame canvas context')
    }

    frameCtx.drawImage(
      canvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    )

    const pngDataUrl = frameCanvas.toDataURL('image/png')
    const pngBase64 = pngDataUrl.split(',')[1]
    const pngBinary = atob(pngBase64)
    const pngArray = new Uint8Array(pngBinary.length)

    for (let j = 0; j < pngBinary.length; j++) {
      pngArray[j] = pngBinary.charCodeAt(j)
    }

    const filename = `frame_${String(i).padStart(4, '0')}.png`
    zip.file(filename, pngArray)

    onProgress?.({
      currentFrame: i + 1,
      totalFrames: frames.length,
      currentAnimation: 0,
      totalAnimations: 1,
      stage: 'rendering',
    })
  }

  onProgress?.({
    currentFrame: frames.length,
    totalFrames: frames.length,
    currentAnimation: 0,
    totalAnimations: 1,
    stage: 'packaging',
  })

  return await zip.generateAsync({ type: 'blob' })
}
