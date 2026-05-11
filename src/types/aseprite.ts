export interface AsepriteFile {
  frames: Record<string, AsepriteFrame>
  meta: AsepriteMeta
}

export interface AsepriteFrame {
  frame: AsepriteFrameRect
  rotated: boolean
  trimmed: boolean
  spriteSourceSize: AsepriteRect
  sourceSize: AsepriteSize
  duration: number
}

export interface AsepriteFrameRect {
  x: number
  y: number
  w: number
  h: number
}

export interface AsepriteRect {
  x: number
  y: number
  w: number
  h: number
}

export interface AsepriteSize {
  w: number
  h: number
}

export interface AsepriteMeta {
  format: string
  size: AsepriteSize
  scale: string
  frameTags: AsepriteFrameTag[]
  layers: string[]
  slices: string[]
}

export interface AsepriteFrameTag {
  name: string
  from: number
  to: number
  direction: 'forward' | 'reverse' | 'pingpong'
}
