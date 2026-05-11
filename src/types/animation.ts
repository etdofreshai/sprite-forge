export interface AnimationGroup {
  id: string
  name: string
  frameIds: string[]
  defaultDurationMs: number
}

export interface AlignmentPoint {
  x: number
  y: number
  label: string
}
