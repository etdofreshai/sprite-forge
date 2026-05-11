import { describe, it, expect } from 'vitest'
import { generateAsepriteJson, asepriteJsonToString } from '../asepriteJson'
import type { Frame, AnimationGroup } from '../../../types'

describe('Aseprite JSON generator', () => {
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
  ]

  const mockAnimations: AnimationGroup[] = [
    {
      id: 'anim-1',
      name: 'idle',
      frameIds: ['frame-1', 'frame-2', 'frame-3'],
      defaultDurationMs: 100,
    },
  ]

  describe('generateAsepriteJson', () => {
    it('should generate valid Aseprite JSON structure', () => {
      const result = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: mockAnimations,
      })

      expect(result).toHaveProperty('frames')
      expect(result).toHaveProperty('meta')
      expect(Object.keys(result.frames)).toHaveLength(3)
    })

    it('should generate correct frame data', () => {
      const result = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: mockAnimations,
      })

      const firstKey = Object.keys(result.frames)[0]
      const firstFrame = result.frames[firstKey]
      expect(firstKey).toBe('idle_0000.png')
      expect(firstFrame.frame.x).toBe(0)
      expect(firstFrame.frame.y).toBe(0)
      expect(firstFrame.frame.w).toBe(64)
      expect(firstFrame.frame.h).toBe(64)
      expect(firstFrame.duration).toBe(100)
      expect(firstFrame.rotated).toBe(false)
      expect(firstFrame.trimmed).toBe(false)
    })

    it('should generate frame tags for animations', () => {
      const result = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: mockAnimations,
      })

      expect(result.meta.frameTags).toHaveLength(1)
      const tag = result.meta.frameTags[0]
      expect(tag.name).toBe('idle')
      expect(tag.from).toBe(0)
      expect(tag.to).toBe(2)
      expect(tag.direction).toBe('forward')
    })

    it('should sanitize animation names with special characters', () => {
      const animationsWithSpecialChars: AnimationGroup[] = [
        {
          id: 'anim-1',
          name: 'walk left',
          frameIds: ['frame-1'],
          defaultDurationMs: 100,
        },
      ]

      const result = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: animationsWithSpecialChars,
      })

      expect(result.meta.frameTags[0].name).toBe('walk_left')
    })

    it('should use default frame names for unassigned frames', () => {
      const emptyAnimations: AnimationGroup[] = []

      const result = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: emptyAnimations,
      })

      const keys = Object.keys(result.frames)
      expect(keys[0]).toBe('frame_0000.png')
      expect(keys[1]).toBe('frame_0001.png')
      expect(keys[2]).toBe('frame_0002.png')
    })

    it('should set correct meta properties', () => {
      const result = generateAsepriteJson({
        spriteSheetSize: { width: 512, height: 256 },
        frames: mockFrames,
        animations: mockAnimations,
      })

      expect(result.meta.format).toBe('RGBA8888')
      expect(result.meta.size.w).toBe(512)
      expect(result.meta.size.h).toBe(256)
      expect(result.meta.scale).toBe('1')
      expect(result.meta.layers).toEqual([])
      expect(result.meta.slices).toEqual([])
    })

    it('should filter out animations with no frames', () => {
      const animationsWithEmpty: AnimationGroup[] = [
        {
          id: 'anim-1',
          name: 'idle',
          frameIds: ['frame-1', 'frame-2'],
          defaultDurationMs: 100,
        },
        {
          id: 'anim-2',
          name: 'empty',
          frameIds: [],
          defaultDurationMs: 100,
        },
      ]

      const result = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: animationsWithEmpty,
      })

      expect(result.meta.frameTags).toHaveLength(1)
      expect(result.meta.frameTags[0].name).toBe('idle')
    })
  })

  describe('asepriteJsonToString', () => {
    it('should convert Aseprite JSON to string', () => {
      const json = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: mockAnimations,
      })

      const str = asepriteJsonToString(json)

      expect(typeof str).toBe('string')
      expect(str.startsWith('{')).toBe(true)
      expect(str.endsWith('}')).toBe(true)

      const parsed = JSON.parse(str)
      expect(parsed).toEqual(json)
    })

    it('should produce formatted JSON with 2-space indentation', () => {
      const json = generateAsepriteJson({
        spriteSheetSize: { width: 256, height: 256 },
        frames: mockFrames,
        animations: mockAnimations,
      })

      const str = asepriteJsonToString(json)

      expect(str).toContain('  ')
      expect(str).not.toContain('\t')
    })
  })
})
