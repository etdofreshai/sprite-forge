export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface SpriteSheetSource {
  imageData: ImageData
  width: number
  height: number
  fileName: string
}

export interface FrameRegion {
  rect: Rect
  sourceIndex: number
}

export interface SkeletalMarkers {
  pelvis: Point
  head: Point
  leftHand: Point
  rightHand: Point
  leftFoot: Point
  rightFoot: Point
}

export interface Point {
  x: number
  y: number
}

export interface Frame {
  id: string
  region: FrameRegion
  durationMs: number
  skeletalMarkers?: SkeletalMarkers
  imageData?: ImageData
}
