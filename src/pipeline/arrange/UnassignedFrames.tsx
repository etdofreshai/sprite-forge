import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { FrameThumbnail } from './FrameThumbnail'
import type { Frame } from '../../types'

interface UnassignedFramesProps {
  frames: Frame[]
  sourceImage: ImageData | null
  assignedFrameIds: Set<string>
}

export const UnassignedFrames = memo(({ frames, sourceImage, assignedFrameIds }: UnassignedFramesProps) => {
  const unassignedFrames = frames.filter((f) => !assignedFrameIds.has(f.id))
  const { setNodeRef } = useDroppable({
    id: 'unassigned',
    data: { type: 'unassigned' as const },
  })

  return (
    <div className="unassigned-frames-section">
      <div className="unassigned-frames-header">
        <h3>Unassigned Frames</h3>
      </div>
      <div ref={setNodeRef} className="unassigned-frames-grid">
        {unassignedFrames.map((frame) => (
          <FrameThumbnail key={frame.id} frame={frame} sourceImage={sourceImage} />
        ))}
      </div>
    </div>
  )
})
