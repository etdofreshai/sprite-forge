import { useState, useRef, useEffect, memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FrameThumbnail } from './FrameThumbnail'
import { FrameDurationEditor } from './FrameDurationEditor'
import { usePipelineStore } from '../../store/pipelineStore'
import type { AnimationGroup, Frame } from '../../types'

interface AnimationRowProps {
  animation: AnimationGroup
  frames: Frame[]
  sourceImage: ImageData | null
  onRemove: (animationId: string) => void
}

interface SortableFrameProps {
  frame: Frame
  sourceImage: ImageData | null
  animationId: string
  onDurationEdit: (frameId: string) => void
  editingFrameId: string | null
}

const SortableFrame = ({ frame, sourceImage, animationId, onDurationEdit, editingFrameId }: SortableFrameProps) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: frame.id,
    data: { frame, animationId, type: 'frame' as const },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className={editingFrameId === frame.id ? 'frame-thumbnail duration-highlight' : ''}>
        <FrameThumbnail
          frame={frame}
          sourceImage={sourceImage}
          onDoubleClick={() => onDurationEdit(frame.id)}
        />
      </div>
    </div>
  )
}

export const AnimationRow = memo(({ animation, frames, sourceImage, onRemove }: AnimationRowProps) => {
  const { setAnimationName, setFrameDuration } = usePipelineStore()
  const [name, setName] = useState(animation.name)
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null)
  const durationEditorRef = useRef<HTMLDivElement>(null)

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: animation.id,
    data: { animationId: animation.id, type: 'animation' as const },
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    setAnimationName(animation.id, newName)
  }

  const handleDurationEdit = (frameId: string) => {
    setEditingFrameId(frameId)
  }

  const handleDurationUpdate = (frameId: string, durationMs: number) => {
    setFrameDuration(frameId, durationMs)
    setEditingFrameId(null)
  }

  const handleRemove = () => {
    onRemove(animation.id)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (durationEditorRef.current && !durationEditorRef.current.contains(e.target as Node)) {
        setEditingFrameId(null)
      }
    }

    if (editingFrameId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingFrameId])

  const animationFrames = animation.frameIds.map((id) => frames.find((f) => f.id === id)).filter(Boolean) as Frame[]

  return (
    <div className="animation-row" ref={setDroppableRef}>
      <div className="animation-header">
        <div className="drag-handle" title="Drag to reorder animations">
          ⠿
        </div>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          className="animation-name-input"
          placeholder="Animation name"
        />
        <button className="remove-animation-btn" onClick={handleRemove} title="Remove animation">
          ×
        </button>
      </div>
      <SortableContext items={animation.frameIds} strategy={verticalListSortingStrategy}>
        <div className="animation-frames" ref={durationEditorRef}>
          {animationFrames.map((frame) => (
            <div key={frame.id} className="frame-thumbnail-wrapper">
              <SortableFrame
                frame={frame}
                sourceImage={sourceImage}
                animationId={animation.id}
                onDurationEdit={handleDurationEdit}
                editingFrameId={editingFrameId}
              />
              {editingFrameId === frame.id && (
                <FrameDurationEditor
                  frameId={frame.id}
                  currentDuration={frame.durationMs}
                  defaultDuration={animation.defaultDurationMs}
                  onUpdate={handleDurationUpdate}
                  onClose={() => setEditingFrameId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  )
})
