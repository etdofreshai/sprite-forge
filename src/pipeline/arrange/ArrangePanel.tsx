import { useMemo } from 'react'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { AnimationRow } from './AnimationRow'
import { UnassignedFrames } from './UnassignedFrames'
import { usePipelineStore } from '../../store/pipelineStore'
import './ArrangePanel.css'

interface DragData {
  frame?: { id: string }
  animationId?: string
  type?: 'frame' | 'animation'
}

export const ArrangePanel = () => {
  const { frames, animations, sourceImage, addAnimation, removeAnimation, moveFrameToAnimation } = usePipelineStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const assignedFrameIds = useMemo(() => {
    const set = new Set<string>()
    animations.forEach((anim) => anim.frameIds.forEach((id) => set.add(id)))
    return set
  }, [animations])

  const handleAddAnimation = () => {
    const name = `Animation ${animations.length + 1}`
    addAnimation(name)
  }

  const handleRemoveAnimation = (animationId: string) => {
    removeAnimation(animationId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as DragData
    const overData = over.data.current as DragData

    const overId = String(over.id)

    // Handle frame dropping
    if (activeData?.frame) {
      const activeFrameId = activeData.frame.id

      // Dropping into unassigned frames
      if (overId === 'unassigned') {
        const currentAnimation = animations.find((a) => a.frameIds.includes(activeFrameId))
        if (currentAnimation) {
          moveFrameToAnimation(activeFrameId, currentAnimation.id, null, 0)
        }
        return
      }

      // Dropping into an animation row (append to end)
      if (overData?.animationId) {
        const targetAnimationId = overData.animationId
        const currentAnimation = animations.find((a) => a.frameIds.includes(activeFrameId))

        if (currentAnimation?.id === targetAnimationId) return

        const targetAnimation = animations.find((a) => a.id === targetAnimationId)
        if (!targetAnimation) return

        moveFrameToAnimation(activeFrameId, currentAnimation?.id || null, targetAnimationId, targetAnimation.frameIds.length)
        return
      }

      // Dropping on another frame (reorder within same animation or move to specific position)
      if (overData?.frame) {
        const targetFrameId = overData.frame.id

        // Find which animation the target frame belongs to
        const targetAnimation = animations.find((a) => a.frameIds.includes(targetFrameId))
        if (!targetAnimation) return

        const currentAnimation = animations.find((a) => a.frameIds.includes(activeFrameId))
        const targetIndex = targetAnimation.frameIds.indexOf(targetFrameId)

        // If moving within same animation, let the sortable context handle it
        if (currentAnimation?.id === targetAnimation.id) {
          return
        }

        // Moving from one animation to another at specific position
        moveFrameToAnimation(activeFrameId, currentAnimation?.id || null, targetAnimation.id, targetIndex)
      }
    }
  }

  const hasFrames = frames.length > 0

  if (!hasFrames) {
    return (
      <div className="arrange-panel">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">No frames to arrange. Complete the Split stage first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="arrange-panel">
      <div className="arrange-header">
        <h2>Arrange Animations</h2>
        <button className="add-animation-btn" onClick={handleAddAnimation}>
          + Add Animation
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="arrange-content">
          <div className="animations-list">
            {animations.map((animation) => (
              <AnimationRow
                key={animation.id}
                animation={animation}
                frames={frames}
                sourceImage={sourceImage?.imageData || null}
                onRemove={handleRemoveAnimation}
              />
            ))}
            {animations.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🎬</div>
                <p className="empty-state-text">Create an animation to start arranging frames.</p>
              </div>
            )}
          </div>
          <UnassignedFrames frames={frames} sourceImage={sourceImage?.imageData || null} assignedFrameIds={assignedFrameIds} />
        </div>
      </DndContext>
    </div>
  )
}
