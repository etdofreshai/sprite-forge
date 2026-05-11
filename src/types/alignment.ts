export interface AlignmentPoint {
  x: number
  y: number
  label: string
}

export interface AlignmentConfig {
  anchorFrameId: string | null
  anchorPoint: AlignmentPoint | null
  enabled: boolean
}

export interface FrameAlignment {
  frameId: string
  offsetY: number
  alignmentPoint: AlignmentPoint | null
}
