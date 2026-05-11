import { pipelineRegistry } from '../../pipeline/registry'
import type { PipelineStage } from '../../types'
import './TabBar.css'

export const TabBar: React.FC<{
  activeStage: PipelineStage
  onStageChange: (stage: PipelineStage) => void
}> = ({ activeStage, onStageChange }) => {
  const stages = pipelineRegistry.getStages()

  return (
    <div className="tab-bar">
      {stages.map((stage) => (
        <button
          key={stage.id}
          className={`tab ${activeStage === stage.id ? 'tab-active' : ''}`}
          onClick={() => onStageChange(stage.id)}
        >
          {stage.label}
        </button>
      ))}
    </div>
  )
}
