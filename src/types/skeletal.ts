export interface Point {
  x: number
  y: number
}

export type MarkerName = 'pelvis' | 'head' | 'leftHand' | 'rightHand' | 'leftFoot' | 'rightFoot'

export interface SkeletalMarkers {
  pelvis: Point
  head: Point
  leftHand: Point
  rightHand: Point
  leftFoot: Point
  rightFoot: Point
}

export interface MarkerConfig {
  name: MarkerName
  label: string
  color: string
  defaultPosition: (frameWidth: number, frameHeight: number) => Point
}
