import type { SpriteSheetSource } from './frame'
import type { Frame } from './frame'
import type { AnimationGroup } from './animation'
import type { AlignmentConfig } from './alignment'
import type { ExportConfig } from './export'

export type PipelineStage = 'generate' | 'split' | 'align' | 'arrange' | 'preview' | 'export'

export interface StageCompletion {
  generate: boolean
  split: boolean
  align: boolean
  arrange: boolean
  preview: boolean
  export: boolean
}

export interface PipelineState {
  sourceImage: SpriteSheetSource | null
  frames: Frame[]
  animations: AnimationGroup[]
  alignmentConfig: AlignmentConfig
  exportConfig: ExportConfig
  stageCompletion: StageCompletion
  currentStage: PipelineStage
}

export interface PipelineStateUpdate {
  sourceImage?: SpriteSheetSource | null
  frames?: Frame[]
  animations?: AnimationGroup[]
  alignmentConfig?: Partial<AlignmentConfig>
  exportConfig?: Partial<ExportConfig>
  stageCompletion?: Partial<StageCompletion>
  currentStage?: PipelineStage
}
