import type { ComponentType } from 'react'
import type { PipelineStage } from '../types'

export interface StageConfig {
  id: PipelineStage
  label: string
  order: number
  PanelComponent: ComponentType
}

class PipelineRegistry {
  private stages: Map<PipelineStage, StageConfig> = new Map()

  registerStage(config: StageConfig): void {
    this.stages.set(config.id, config)
  }

  getStages(): StageConfig[] {
    return Array.from(this.stages.values()).sort((a, b) => a.order - b.order)
  }

  getStage(id: PipelineStage): StageConfig | undefined {
    return this.stages.get(id)
  }

  getPanelComponent(id: PipelineStage): ComponentType | undefined {
    return this.stages.get(id)?.PanelComponent
  }
}

export const pipelineRegistry = new PipelineRegistry()
