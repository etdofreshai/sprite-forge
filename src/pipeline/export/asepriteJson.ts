import type {
  AsepriteFile,
  AsepriteFrame,
  AsepriteMeta,
  AsepriteFrameRect,
  AsepriteRect,
  AsepriteSize,
  AsepriteFrameTag,
} from '../../types/aseprite'
import type { Frame, AnimationGroup } from '../../types'

export interface AsepriteJsonOptions {
  spriteSheetSize: { width: number; height: number }
  frames: Frame[]
  animations: AnimationGroup[]
}

export function generateAsepriteJson(options: AsepriteJsonOptions): AsepriteFile {
  const { spriteSheetSize, frames, animations } = options

  const asepriteFrames: Record<string, AsepriteFrame> = {}
  frames.forEach((frame, index) => {
    const { rect } = frame.region
    const frameRect: AsepriteFrameRect = {
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
    }

    const spriteSourceSize: AsepriteRect = {
      x: 0,
      y: 0,
      w: rect.width,
      h: rect.height,
    }

    const sourceSize: AsepriteSize = {
      w: rect.width,
      h: rect.height,
    }

    const filename = generateFrameFilename(frame, index, animations)
    asepriteFrames[filename] = {
      frame: frameRect,
      rotated: false,
      trimmed: false,
      spriteSourceSize,
      sourceSize,
      duration: frame.durationMs,
    }
  })

  const frameTags: AsepriteFrameTag[] = animations
    .filter((anim) => anim.frameIds.length > 0)
    .map((animation) => {
      const frameIndices = animation.frameIds
        .map((id: string) => frames.findIndex((f) => f.id === id))
        .filter((idx: number) => idx !== -1)

      if (frameIndices.length === 0) {
        return null
      }

      return {
        name: sanitizeAnimationName(animation.name),
        from: Math.min(...frameIndices),
        to: Math.max(...frameIndices),
        direction: 'forward',
      }
    })
    .filter((tag): tag is AsepriteFrameTag => tag !== null)

  const meta: AsepriteMeta = {
    format: 'RGBA8888',
    size: {
      w: spriteSheetSize.width,
      h: spriteSheetSize.height,
    },
    scale: '1',
    frameTags,
    layers: [],
    slices: [],
  }

  return {
    frames: asepriteFrames,
    meta,
  }
}

function generateFrameFilename(
  frame: Frame,
  index: number,
  animations: AnimationGroup[]
): string {
  const animation = animations.find((a) => a.frameIds.includes(frame.id))

  if (animation) {
    const frameIndex = animation.frameIds.indexOf(frame.id)
    const sanitizedName = sanitizeAnimationName(animation.name)
    return `${sanitizedName}_${String(frameIndex).padStart(4, '0')}.png`
  }

  return `frame_${String(index).padStart(4, '0')}.png`
}

function sanitizeAnimationName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function asepriteJsonToString(json: AsepriteFile): string {
  return JSON.stringify(json, null, 2)
}
