import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { pipelineRegistry } from './pipeline/registry'
import { GeneratePanel } from './pipeline/generate'
import { SplitPanel } from './pipeline/split'
import { ArrangePanel } from './pipeline/arrange'
import { PreviewPanel } from './pipeline/preview'
import { ExportPanel } from './pipeline/export'
import './App.css'

function App() {
  useEffect(() => {
    pipelineRegistry.registerStage({
      id: 'generate',
      label: 'Generate',
      order: 0,
      PanelComponent: GeneratePanel,
    })

    pipelineRegistry.registerStage({
      id: 'split',
      label: 'Split',
      order: 1,
      PanelComponent: SplitPanel,
    })

    pipelineRegistry.registerStage({
      id: 'arrange',
      label: 'Arrange',
      order: 2,
      PanelComponent: ArrangePanel,
    })

    pipelineRegistry.registerStage({
      id: 'preview',
      label: 'Preview',
      order: 3,
      PanelComponent: PreviewPanel,
    })

    pipelineRegistry.registerStage({
      id: 'export',
      label: 'Export',
      order: 4,
      PanelComponent: ExportPanel,
    })
  }, [])

  return <AppShell />
}

export default App
