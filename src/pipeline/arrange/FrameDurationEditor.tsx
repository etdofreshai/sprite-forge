import { useState } from 'react'

interface FrameDurationEditorProps {
  frameId: string
  currentDuration: number
  defaultDuration: number
  onUpdate: (frameId: string, durationMs: number) => void
  onClose: () => void
}

const MIN_DURATION = 16
const MAX_DURATION = 500

export const FrameDurationEditor = ({
  frameId,
  currentDuration,
  defaultDuration,
  onUpdate,
  onClose,
}: FrameDurationEditorProps) => {
  const [duration, setDuration] = useState(currentDuration)

  const handleApply = () => {
    onUpdate(frameId, duration)
    onClose()
  }

  const handleReset = () => {
    setDuration(defaultDuration)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(Number(e.target.value))
  }

  return (
    <div className="duration-popover">
      <div className="duration-popover-header">
        <span className="duration-popover-label">Frame Duration</span>
        <span className="duration-value">{duration}ms</span>
      </div>
      <input
        type="range"
        min={MIN_DURATION}
        max={MAX_DURATION}
        value={duration}
        onChange={handleSliderChange}
        className="duration-slider"
      />
      <div className="duration-popover-footer">
        <button className="duration-reset-btn" onClick={handleReset}>
          Reset to {defaultDuration}ms
        </button>
        <button className="duration-apply-btn" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  )
}
