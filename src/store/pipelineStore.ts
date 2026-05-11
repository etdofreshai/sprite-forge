import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PipelineState, Frame, AnimationGroup, SpriteSheetSource } from '../types'
import type { ExportConfig, PipelineStage } from '../types'

interface PipelineActions {
  setSourceImage: (source: SpriteSheetSource | null) => void
  setFrames: (frames: Frame[]) => void
  moveFrameToAnimation: (
    frameId: string,
    fromAnimationId: string | null,
    toAnimationId: string | null,
    toIndex: number
  ) => void
  setFrameDuration: (frameId: string, durationMs: number) => void
  setAnimationName: (animationId: string, name: string) => void
  addAnimation: (name: string) => void
  removeAnimation: (animationId: string) => void
  setAlignmentAnchor: (frameId: string | null, point: { x: number; y: number } | null) => void
  setSkeletalMarker: (frameId: string, markerName: string, point: { x: number; y: number }) => void
  reorderFrames: (animationId: string | null, fromIndex: number, toIndex: number) => void
  setExportConfig: (config: Partial<ExportConfig>) => void
  markStageComplete: (stage: PipelineStage, complete: boolean) => void
  setCurrentStage: (stage: PipelineStage) => void
}

type PipelineStore = PipelineState & PipelineActions

const createInitialState = (): PipelineState => ({
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

export const usePipelineStore = create<PipelineStore>()(
  immer((set, get) => ({
    ...createInitialState(),

    setSourceImage: (source) =>
      set((state) => {
        state.sourceImage = source
      }),

    setFrames: (frames) =>
      set((state) => {
        state.frames = frames
      }),

    moveFrameToAnimation: (frameId, fromAnimationId, toAnimationId, toIndex) =>
      set((state) => {
        const frame = get().frames.find((f) => f.id === frameId)
        if (!frame) return

        if (fromAnimationId === toAnimationId) {
          const animation = state.animations.find((a) => a.id === fromAnimationId)
          if (!animation) return

          const fromIdx = animation.frameIds.indexOf(frameId)
          if (fromIdx === -1) return

          animation.frameIds.splice(fromIdx, 1)
          animation.frameIds.splice(toIndex, 0, frameId)
          return
        }

        if (fromAnimationId) {
          const fromAnimation = state.animations.find((a) => a.id === fromAnimationId)
          if (fromAnimation) {
            const idx = fromAnimation.frameIds.indexOf(frameId)
            if (idx !== -1) {
              fromAnimation.frameIds.splice(idx, 1)
            }
          }
        }

        if (toAnimationId) {
          const toAnimation = state.animations.find((a) => a.id === toAnimationId)
          if (toAnimation) {
            toAnimation.frameIds.splice(toIndex, 0, frameId)
          }
        }
      }),

    setFrameDuration: (frameId, durationMs) =>
      set((state) => {
        const frame = state.frames.find((f) => f.id === frameId)
        if (frame) {
          frame.durationMs = durationMs
        }
      }),

    setAnimationName: (animationId, name) =>
      set((state) => {
        const animation = state.animations.find((a) => a.id === animationId)
        if (animation) {
          animation.name = name
        }
      }),

    addAnimation: (name) =>
      set((state) => {
        const newAnimation: AnimationGroup = {
          id: `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          frameIds: [],
          defaultDurationMs: 100,
        }
        state.animations.push(newAnimation)
      }),

    removeAnimation: (animationId) =>
      set((state) => {
        const idx = state.animations.findIndex((a) => a.id === animationId)
        if (idx !== -1) {
          state.animations.splice(idx, 1)
        }
      }),

    setAlignmentAnchor: (frameId, point) =>
      set((state) => {
        state.alignmentConfig.anchorFrameId = frameId
        state.alignmentConfig.anchorPoint = point
          ? { x: point.x, y: point.y, label: 'anchor' }
          : null
      }),

    setSkeletalMarker: (frameId, markerName, point) =>
      set((state) => {
        const frame = state.frames.find((f) => f.id === frameId)
        if (frame) {
          if (!frame.skeletalMarkers) {
            frame.skeletalMarkers = {
              pelvis: { x: 0, y: 0 },
              head: { x: 0, y: 0 },
              leftHand: { x: 0, y: 0 },
              rightHand: { x: 0, y: 0 },
              leftFoot: { x: 0, y: 0 },
              rightFoot: { x: 0, y: 0 },
            }
          }
          if (markerName in frame.skeletalMarkers) {
            frame.skeletalMarkers[markerName as keyof typeof frame.skeletalMarkers] = point
          }
        }
      }),

    reorderFrames: (animationId, fromIndex, toIndex) =>
      set((state) => {
        if (animationId === null) return
        const animation = state.animations.find((a) => a.id === animationId)
        if (animation) {
          const [frameId] = animation.frameIds.splice(fromIndex, 1)
          animation.frameIds.splice(toIndex, 0, frameId)
        }
      }),

    setExportConfig: (config) =>
      set((state) => {
        state.exportConfig = { ...state.exportConfig, ...config }
      }),

    markStageComplete: (stage, complete) =>
      set((state) => {
        state.stageCompletion[stage] = complete
      }),

    setCurrentStage: (stage) =>
      set((state) => {
        state.currentStage = stage
      }),
  }))
)
