import { describe, it, expect } from 'vitest'
import { generateAsepriteJson, asepriteJsonToString, bundleExportZip } from '../index'
import type { Frame, AnimationGroup, SpriteSheetSource } from '../../../types'

describe('Export integration tests', () => {
  const createMockImageData = (width: number, height: number): ImageData => {
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    }
    return new ImageData(data, width, height)
  }

  const mockSource: SpriteSheetSource = {
    imageData: createMockImageData(256, 256),
    width: 256,
    height: 256,
    fileName: 'test_spritesheet.png',
  }

  const mockFrames: Frame[] = [
    {
      id: 'frame-1',
      region: {
        rect: { x: 0, y: 0, width: 64, height: 64 },
        sourceIndex: 0,
      },
      durationMs: 100,
    },
    {
      id: 'frame-2',
      region: {
        rect: { x: 64, y: 0, width: 64, height: 64 },
        sourceIndex: 0,
      },
      durationMs: 100,
    },
    {
      id: 'frame-3',
      region: {
        rect: { x: 128, y: 0, width: 64, height: 64 },
        sourceIndex: 0,
      },
      durationMs: 100,
    },
    {
      id: 'frame-4',
      region: {
        rect: { x: 192, y: 0, width: 64, height: 64 },
        sourceIndex: 0,
      },
      durationMs: 100,
    },
  ]

  const mockAnimations: AnimationGroup[] = [
    {
      id: 'anim-idle',
      name: 'idle',
      frameIds: ['frame-1', 'frame-2'],
      defaultDurationMs: 100,
    },
    {
      id: 'anim-walk',
      name: 'walk',
      frameIds: ['frame-3', 'frame-4'],
      defaultDurationMs: 100,
    },
  ]

  it('should complete full export workflow from frames to ZIP', async () => {
    const asepriteJson = generateAsepriteJson({
      spriteSheetSize: { width: 256, height: 256 },
      frames: mockFrames,
      animations: mockAnimations,
    })

    expect(Object.keys(asepriteJson.frames)).toHaveLength(4)
    expect(asepriteJson.meta.frameTags).toHaveLength(2)

    const jsonString = asepriteJsonToString(asepriteJson)
    expect(jsonString).toContain('"frames"')
    expect(jsonString).toContain('"meta"')

    const blob = await bundleExportZip({
      sourceImage: mockSource,
      frames: mockFrames,
      asepriteJson,
      outputFileName: 'test_export',
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/zip')
  })

  it('should generate correct frame filenames for multiple animations', () => {
    const asepriteJson = generateAsepriteJson({
      spriteSheetSize: { width: 256, height: 256 },
      frames: mockFrames,
      animations: mockAnimations,
    })

    const keys = Object.keys(asepriteJson.frames)
    expect(keys[0]).toBe('idle_0000.png')
    expect(keys[1]).toBe('idle_0001.png')
    expect(keys[2]).toBe('walk_0000.png')
    expect(keys[3]).toBe('walk_0001.png')
  })

  it('should generate correct frame tags for multiple animations', () => {
    const asepriteJson = generateAsepriteJson({
      spriteSheetSize: { width: 256, height: 256 },
      frames: mockFrames,
      animations: mockAnimations,
    })

    const idleTag = asepriteJson.meta.frameTags.find((t) => t.name === 'idle')
    expect(idleTag).toBeDefined()
    expect(idleTag?.from).toBe(0)
    expect(idleTag?.to).toBe(1)
    expect(idleTag?.direction).toBe('forward')

    const walkTag = asepriteJson.meta.frameTags.find((t) => t.name === 'walk')
    expect(walkTag).toBeDefined()
    expect(walkTag?.from).toBe(2)
    expect(walkTag?.to).toBe(3)
    expect(walkTag?.direction).toBe('forward')
  })

  it('should handle frames with skeletal markers', () => {
    const framesWithMarkers: Frame[] = [
      {
        id: 'frame-1',
        region: {
          rect: { x: 0, y: 0, width: 64, height: 64 },
          sourceIndex: 0,
        },
        durationMs: 100,
        skeletalMarkers: {
          pelvis: { x: 32, y: 40 },
          head: { x: 32, y: 10 },
          leftHand: { x: 10, y: 30 },
          rightHand: { x: 54, y: 30 },
          leftFoot: { x: 20, y: 60 },
          rightFoot: { x: 44, y: 60 },
        },
      },
    ]

    const asepriteJson = generateAsepriteJson({
      spriteSheetSize: { width: 64, height: 64 },
      frames: framesWithMarkers,
      animations: [],
    })

    expect(Object.keys(asepriteJson.frames)).toHaveLength(1)
    expect(Object.keys(asepriteJson.frames)[0]).toBe('frame_0000.png')
  })

  it('should sanitize animation names in frame tags', () => {
    const animationsWithSpecialChars: AnimationGroup[] = [
      {
        id: 'anim-1',
        name: 'walk left',
        frameIds: ['frame-1', 'frame-2'],
        defaultDurationMs: 100,
      },
      {
        id: 'anim-2',
        name: 'jump-right',
        frameIds: ['frame-3', 'frame-4'],
        defaultDurationMs: 100,
      },
    ]

    const asepriteJson = generateAsepriteJson({
      spriteSheetSize: { width: 256, height: 256 },
      frames: mockFrames,
      animations: animationsWithSpecialChars,
    })

    expect(asepriteJson.meta.frameTags[0].name).toBe('walk_left')
    expect(asepriteJson.meta.frameTags[1].name).toBe('jump-right')
  })
})
