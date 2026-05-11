import { describe, it, expect, beforeEach } from 'vitest'
import { usePipelineStore } from '../pipelineStore'
import type { Frame, SpriteSheetSource } from '../../types'

const mockSourceImage: SpriteSheetSource = {
  imageData: new ImageData(100, 100),
  width: 100,
  height: 100,
  fileName: 'test.png',
}

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

describe('PipelineStore', () => {
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

  describe('initial state', () => {
    it('initializes with empty defaults', () => {
      const state = usePipelineStore.getState()
      expect(state.sourceImage).toBeNull()
      expect(state.frames).toEqual([])
      expect(state.animations).toEqual([])
      expect(state.alignmentConfig.anchorFrameId).toBeNull()
      expect(state.currentStage).toBe('generate')
    })
  })

  describe('setSourceImage', () => {
    it('sets the source image', () => {
      usePipelineStore.getState().setSourceImage(mockSourceImage)
      expect(usePipelineStore.getState().sourceImage).toEqual(mockSourceImage)
    })

    it('can clear the source image', () => {
      usePipelineStore.getState().setSourceImage(mockSourceImage)
      usePipelineStore.getState().setSourceImage(null)
      expect(usePipelineStore.getState().sourceImage).toBeNull()
    })
  })

  describe('setFrames', () => {
    it('sets frames', () => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2])
      expect(usePipelineStore.getState().frames).toHaveLength(2)
    })
  })

  describe('moveFrameToAnimation', () => {
    beforeEach(() => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2, mockFrame3])
      usePipelineStore.getState().addAnimation('anim1')
      usePipelineStore.getState().addAnimation('anim2')
    })

    it('moves frame from unassigned to animation', () => {
      const state = usePipelineStore.getState()
      const anim1Id = state.animations[0].id

      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, anim1Id, 0)

      const updatedState = usePipelineStore.getState()
      expect(updatedState.animations[0].frameIds).toEqual(['frame-1'])
    })

    it('moves frame between animations', () => {
      const state = usePipelineStore.getState()
      const anim1Id = state.animations[0].id
      const anim2Id = state.animations[1].id

      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, anim1Id, 0)
      usePipelineStore.getState().moveFrameToAnimation('frame-2', null, anim1Id, 1)
      usePipelineStore.getState().moveFrameToAnimation('frame-1', anim1Id, anim2Id, 0)

      const updatedState = usePipelineStore.getState()
      expect(updatedState.animations[0].frameIds).toEqual(['frame-2'])
      expect(updatedState.animations[1].frameIds).toEqual(['frame-1'])
    })

    it('reorders frame within same animation', () => {
      const state = usePipelineStore.getState()
      const anim1Id = state.animations[0].id

      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, anim1Id, 0)
      usePipelineStore.getState().moveFrameToAnimation('frame-2', null, anim1Id, 1)
      usePipelineStore.getState().moveFrameToAnimation('frame-3', null, anim1Id, 2)

      usePipelineStore.getState().moveFrameToAnimation('frame-3', anim1Id, anim1Id, 0)

      const updatedState = usePipelineStore.getState()
      expect(updatedState.animations[0].frameIds).toEqual(['frame-3', 'frame-1', 'frame-2'])
    })
  })

  describe('setFrameDuration', () => {
    it('sets frame duration', () => {
      usePipelineStore.getState().setFrames([mockFrame1])
      usePipelineStore.getState().setFrameDuration('frame-1', 200)
      expect(usePipelineStore.getState().frames[0].durationMs).toBe(200)
    })
  })

  describe('setAnimationName', () => {
    it('sets animation name', () => {
      usePipelineStore.getState().addAnimation('test')
      const state = usePipelineStore.getState()
      usePipelineStore.getState().setAnimationName(state.animations[0].id, 'renamed')
      expect(usePipelineStore.getState().animations[0].name).toBe('renamed')
    })
  })

  describe('addAnimation', () => {
    it('adds new animation', () => {
      usePipelineStore.getState().addAnimation('walk')
      expect(usePipelineStore.getState().animations).toHaveLength(1)
      expect(usePipelineStore.getState().animations[0].name).toBe('walk')
      expect(usePipelineStore.getState().animations[0].frameIds).toEqual([])
    })
  })

  describe('removeAnimation', () => {
    beforeEach(() => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2])
      usePipelineStore.getState().addAnimation('anim1')
      const state = usePipelineStore.getState()
      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, state.animations[0].id, 0)
      usePipelineStore.getState().moveFrameToAnimation('frame-2', null, state.animations[0].id, 1)
    })

    it('removes animation and returns frames to unassigned', () => {
      const state = usePipelineStore.getState()
      const animId = state.animations[0].id

      usePipelineStore.getState().removeAnimation(animId)

      const updatedState = usePipelineStore.getState()
      expect(updatedState.animations).toHaveLength(0)
    })
  })

  describe('setAlignmentAnchor', () => {
    it('sets alignment anchor', () => {
      usePipelineStore.getState().setAlignmentAnchor('frame-1', { x: 10, y: 20 })
      const state = usePipelineStore.getState()
      expect(state.alignmentConfig.anchorFrameId).toBe('frame-1')
      expect(state.alignmentConfig.anchorPoint).toEqual({ x: 10, y: 20, label: 'anchor' })
    })

    it('clears alignment anchor', () => {
      usePipelineStore.getState().setAlignmentAnchor('frame-1', { x: 10, y: 20 })
      usePipelineStore.getState().setAlignmentAnchor(null, null)
      expect(usePipelineStore.getState().alignmentConfig.anchorFrameId).toBeNull()
      expect(usePipelineStore.getState().alignmentConfig.anchorPoint).toBeNull()
    })
  })

  describe('setSkeletalMarker', () => {
    it('sets skeletal marker on frame', () => {
      usePipelineStore.getState().setFrames([mockFrame1])
      usePipelineStore.getState().setSkeletalMarker('frame-1', 'pelvis', { x: 16, y: 16 })
      const frame = usePipelineStore.getState().frames[0]
      expect(frame.skeletalMarkers?.pelvis).toEqual({ x: 16, y: 16 })
    })
  })

  describe('reorderFrames', () => {
    it('reorders frames within animation', () => {
      usePipelineStore.getState().setFrames([mockFrame1, mockFrame2, mockFrame3])
      usePipelineStore.getState().addAnimation('anim1')
      const state = usePipelineStore.getState()
      const animId = state.animations[0].id

      usePipelineStore.getState().moveFrameToAnimation('frame-1', null, animId, 0)
      usePipelineStore.getState().moveFrameToAnimation('frame-2', null, animId, 1)
      usePipelineStore.getState().moveFrameToAnimation('frame-3', null, animId, 2)

      usePipelineStore.getState().reorderFrames(animId, 0, 2)

      const updatedState = usePipelineStore.getState()
      expect(updatedState.animations[0].frameIds).toEqual(['frame-2', 'frame-3', 'frame-1'])
    })
  })

  describe('setExportConfig', () => {
    it('updates export config', () => {
      usePipelineStore.getState().setExportConfig({ format: 'unity', padding: 2 })
      const state = usePipelineStore.getState()
      expect(state.exportConfig.format).toBe('unity')
      expect(state.exportConfig.padding).toBe(2)
    })
  })

  describe('markStageComplete', () => {
    it('marks stage as complete', () => {
      usePipelineStore.getState().markStageComplete('generate', true)
      expect(usePipelineStore.getState().stageCompletion.generate).toBe(true)
    })
  })

  describe('setCurrentStage', () => {
    it('sets current stage', () => {
      usePipelineStore.getState().setCurrentStage('split')
      expect(usePipelineStore.getState().currentStage).toBe('split')
    })
  })
})
