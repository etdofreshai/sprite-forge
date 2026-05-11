import { usePipelineStore } from './pipelineStore'
import type { Frame, AnimationGroup } from '../types'

export const getAllFrames = (): Frame[] => {
  return usePipelineStore.getState().frames
}

export const getAnimationsWithFrames = (): Array<AnimationGroup & { frames: Frame[] }> => {
  const state = usePipelineStore.getState()
  const { animations, frames } = state

  return animations.map((animation) => ({
    ...animation,
    frames: animation.frameIds
      .map((id) => frames.find((f) => f.id === id))
      .filter((f): f is Frame => f !== undefined),
  }))
}

export const getUnassignedFrames = (): Frame[] => {
  const state = usePipelineStore.getState()
  const { animations, frames } = state
  const assignedFrameIds = new Set<string>()

  animations.forEach((animation) => {
    animation.frameIds.forEach((id) => assignedFrameIds.add(id))
  })

  return frames.filter((f) => !assignedFrameIds.has(f.id))
}

export const getFrameById = (frameId: string): Frame | undefined => {
  return usePipelineStore.getState().frames.find((f) => f.id === frameId)
}

export const getAnimationById = (animationId: string): AnimationGroup | undefined => {
  return usePipelineStore.getState().animations.find((a) => a.id === animationId)
}

export const getAssignedFrameIds = (): Set<string> => {
  const state = usePipelineStore.getState()
  const assignedIds = new Set<string>()

  state.animations.forEach((animation) => {
    animation.frameIds.forEach((id) => assignedIds.add(id))
  })

  return assignedIds
}
