import { useState } from 'react'
import { TabBar } from './TabBar'
import { Sidebar } from './Sidebar'
import type { PipelineStage } from '../../types'
import './layout.css'

export const AppShell: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  const [activeStage, setActiveStage] = useState<PipelineStage>('generate')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Sprite Forge</h1>
        <div className="header-actions">
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>
      </header>

      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="app-sidebar">
          <TabBar activeStage={activeStage} onStageChange={setActiveStage} />
          <Sidebar activeStage={activeStage} />
        </div>

        <main className="app-content">
          {children || (
            <div className="canvas-placeholder">
              <p>Canvas Area</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
