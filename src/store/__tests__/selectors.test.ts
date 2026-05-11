import { describe, it, expect, beforeEach } from 'vitest'
import { usePipelineStore } from '../pipelineStore'
import {
  getAllFrames,
  getAnimationsWithFrames,
  getUnassignedFrames,
  getFrameById,
  getAnimationById,
  getAssignedFrameIds,
} from '../selectors'
import type { Frame } from '../../types'

const mockFrame1: Frame = {
  id: 'frame-1',
  region: { rect: { x: 0, y: 0, width: 32, height: 32 }, sourceIndex: 0 },
  durationMs: 100,
}

const mockFrame2: Frame = {
  id: 'frame-2',
  region: { rect: { x: 32, y: 0, width: 32, height: 32 }, sourceIndex: 0 },
  durationMs: 100,
}

const mockFrame3: Frame = {
  id: 'frame-3',
  region: { rect: { x: 64, y: 0, width: 32, height: 32 }, sourceIndex: 0 },
  durationMs: 100,
}

describe('Selectors', () => {
  beforeEach(() => {
    usePipelineStore.setState({
      sourceImage: null,
      frames: [],
      animations: [],
      alignmentConfig: {
        anchorFrameId: null,
        anchorPoint: null,
        enabled: false,
      },
      exportConfig: {
        format: 'aseprite',
        padding: 0,
        namingPattern: '{animation}_{frame:04d}',
        includeAlignmentData: false,
        includeSkeletalMarkers: false,
      },
      stageCompletion: {
        generate: false,
        split: false,
        align: false,
        arrange: false,
        preview: false,
        export: false,
      },
      currentStage: 'generate',
    })
  })

  describe('getAllFrames', () => {
    it('returns all frames', () => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2])
      expect(getAllFrames()).toHaveLength(2)
    })

    it('returns empty array when no frames', () => {
      expect(getAllFrames()).toEqual([])
    })
  })

  describe('getAnimationsWithFrames', () => {
    beforeEach(() => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2, mockFrame3])
      usePipelineStore.getState().addAnimation('walk')
      usePipelineStore.getState().addAnimation('run')
    })

    it('returns animations with their frame objects', () => {
      const state = usePipelineStore.getState()
      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, state.animations[0].id, 0)
      usePipelineStore.getState().moveFrameToAnimation('frame-2', null, state.animations[0].id, 1)
      usePipelineStore.getState().moveFrameToAnimation('frame-3', null, state.animations[1].id, 0)

      const result = getAnimationsWithFrames()
      expect(result).toHaveLength(2)
      expect(result[0].frames).toHaveLength(2)
      expect(result[0].frames[0].id).toBe('frame-1')
      expect(result[1].frames).toHaveLength(1)
      expect(result[1].frames[0].id).toBe('frame-3')
    })

    it('returns empty frames array for animations with no frames', () => {
      const result = getAnimationsWithFrames()
      expect(result).toHaveLength(2)
      expect(result[0].frames).toEqual([])
      expect(result[1].frames).toEqual([])
    })
  })

  describe('getUnassignedFrames', () => {
    beforeEach(() => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2, mockFrame3])
      usePipelineStore.getState().addAnimation('walk')
    })

    it('returns frames not assigned to any animation', () => {
      const state = usePipelineStore.getState()
      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, state.animations[0].id, 0)

      const unassigned = getUnassignedFrames()
      expect(unassigned).toHaveLength(2)
      expect(unassigned.map((f) => f.id)).toEqual(['frame-2', 'frame-3'])
    })

    it('returns all frames when none are assigned', () => {
      const unassigned = getUnassignedFrames()
      expect(unassigned).toHaveLength(3)
    })

    it('returns empty array when all frames are assigned', () => {
      const state = usePipelineStore.getState()
      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, state.animations[0].id, 0)
      usePipelineStore.getState().moveFrameToAnimation('frame-2', null, state.animations[0].id, 1)
      usePipelineStore.getState().moveFrameToAnimation('frame-3', null, state.animations[0].id, 2)

      expect(getUnassignedFrames()).toHaveLength(0)
    })
  })

  describe('getFrameById', () => {
    it('returns frame by id', () => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2])
      expect(getFrameById('frame-1')?.id).toBe('frame-1')
    })

    it('returns undefined for non-existent frame', () => {
      usePipelineStore.getState().setFrames([mockFrame1])
      expect(getFrameById('non-existent')).toBeUndefined()
    })
  })

  describe('getAnimationById', () => {
    it('returns animation by id', () => {
      usePipelineStore.getState().addAnimation('walk')
      const state = usePipelineStore.getState()
      expect(getAnimationById(state.animations[0].id)?.name).toBe('walk')
    })

    it('returns undefined for non-existent animation', () => {
      expect(getAnimationById('non-existent')).toBeUndefined()
    })
  })

  describe('getAssignedFrameIds', () => {
    beforeEach(() => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2, mockFrame3])
      usePipelineStore.getState().addAnimation('walk')
      usePipelineStore.getState().addAnimation('run')
    })

    it('returns set of assigned frame ids', () => {
      const state = usePipelineStore.getState()
      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, state.animations[0].id, 0)
      usePipelineStore.getState().moveFrameToAnimation('frame-2', null, state.animations[1].id, 0)

      const assignedIds = getAssignedFrameIds()
      expect(assignedIds).toEqual(new Set(['frame-1', 'frame-2']))
    })

    it('returns empty set when no frames are assigned', () => {
      const assignedIds = getAssignedFrameIds()
      expect(assignedIds).toEqual(new Set())
    })
  })
})
