import { pipelineRegistry } from '../../pipeline/registry'
import type { PipelineStage } from '../../types'

export const Sidebar: React.FC<{
  activeStage: PipelineStage
}> = ({ activeStage }) => {
  const stageConfig = pipelineRegistry.getStage(activeStage)
  const PanelComponent = stageConfig?.PanelComponent

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {PanelComponent && <PanelComponent />}
      </div>
    </aside>
  )
}
