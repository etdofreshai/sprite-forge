import type { Frame, Point } from '../../types'

export interface AlignmentResult {
  offsets: number[]
  alignedFrames: Frame[]
  commonCanvasSize: { width: number; height: number }
}

export function computeAlignment(frames: Frame[], markers: Point[]): number[] {
  if (frames.length === 0 || markers.length === 0) {
    return []
  }

  if (frames.length !== markers.length) {
    throw new Error(`Frame count (${frames.length}) must match marker count (${markers.length})`)
  }

  const pelvisYValues = markers.map(m => m.y)
  const maxPelvisY = Math.max(...pelvisYValues)

  return pelvisYValues.map(y => maxPelvisY - y)
}

export function applyAlignment(frame: Frame, offsetY: number): Frame {
  const { region } = frame

  return {
    ...frame,
    region: {
      ...region,
      rect: {
        ...region.rect,
        y: region.rect.y + offsetY,
      },
    },
  }
}

export function computeCommonCanvasSize(
  frames: Frame[],
  offsets: number[]
): { width: number; height: number } {
  if (frames.length === 0 || offsets.length === 0) {
    return { width: 0, height: 0 }
  }

  if (frames.length !== offsets.length) {
    throw new Error(`Frame count (${frames.length}) must match offset count (${offsets.length})`)
  }

  let maxWidth = 0
  let maxHeight = 0

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const offset = offsets[i]

    const alignedFrame = applyAlignment(frame, offset)
    const { rect } = alignedFrame.region

    const frameRight = rect.x + rect.width
    const frameBottom = rect.y + rect.height

    maxWidth = Math.max(maxWidth, frameRight)
    maxHeight = Math.max(maxHeight, frameBottom)
  }

  return { width: maxWidth, height: maxHeight }
}
