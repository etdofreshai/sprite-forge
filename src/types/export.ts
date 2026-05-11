export type ExportFormat = 'aseprite' | 'unity' | 'godot' | 'json'

export interface ExportConfig {
  format: ExportFormat
  padding: number
  namingPattern: string
  includeAlignmentData: boolean
  includeSkeletalMarkers: boolean
}

export interface ExportResult {
  fileName: string
  blob: Blob
  format: ExportFormat
  frameCount: number
  animationCount: number
}

export interface ExportProgress {
  currentFrame: number
  totalFrames: number
  currentAnimation: number
  totalAnimations: number
  stage: 'preparing' | 'rendering' | 'packaging' | 'complete'
}
