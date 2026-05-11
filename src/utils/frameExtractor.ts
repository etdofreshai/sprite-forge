import type { Rect } from '../types'
import { cropImageData } from './image'

export interface ExtractedFrame {
  id: string
  imageData: ImageData
  rect: Rect
  sourceIndex: number
}

export type FrameExtractionProgress = {
  current: number
  total: number
  frame: ExtractedFrame | null
}

export type ProgressCallback = (progress: FrameExtractionProgress) => void

export function extractFrames(
  source: ImageData,
  regions: Rect[],
  onProgress?: ProgressCallback,
  sourceIndex: number = 0,
): ExtractedFrame[] {
  const frames: ExtractedFrame[] = []
  const total = regions.length

  for (let i = 0; i < total; i++) {
    const rect = regions[i]
    const imageData = cropImageData(source, rect)
    const frame: ExtractedFrame = {
      id: `frame-${sourceIndex}-${i}`,
      imageData,
      rect,
      sourceIndex,
    }
    frames.push(frame)

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        frame,
      })
    }
  }

  return frames
}
