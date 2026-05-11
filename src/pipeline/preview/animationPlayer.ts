import type { Frame, AnimationGroup, SkeletalMarkers } from '../../types'

export interface PlaybackState {
  isPlaying: boolean
  currentFrameIndex: number
  currentAnimationId: string | null
  fps: number
  loop: boolean
  onionSkinEnabled: boolean
  onionSkinOpacity: number
  showMarkers: boolean
}

export interface OnionSkinConfig {
  enabled: boolean
  opacity: number
  framesBefore: number
  framesAfter: number
}

export const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  currentFrameIndex: 0,
  currentAnimationId: null,
  fps: 12,
  loop: true,
  onionSkinEnabled: false,
  onionSkinOpacity: 0.3,
  showMarkers: true,
}

export class AnimationPlayer {
  private state: PlaybackState
  private animationFrameId: number | null = null
  private lastFrameTime: number = 0
  private onFrameChange?: (state: PlaybackState) => void
  private totalFrames: number = 0

  constructor(
    initialState: Partial<PlaybackState> = {},
    onFrameChange?: (state: PlaybackState) => void
  ) {
    this.state = { ...DEFAULT_PLAYBACK_STATE, ...initialState }
    this.onFrameChange = onFrameChange
  }

  setTotalFrames(count: number): void {
    this.totalFrames = Math.max(0, count)
  }

  getState(): PlaybackState {
    return { ...this.state }
  }

  setState(updates: Partial<PlaybackState>): void {
    this.state = { ...this.state, ...updates }
    this.onFrameChange?.(this.state)
  }

  play(): void {
    if (this.state.isPlaying) return
    this.state.isPlaying = true
    this.lastFrameTime = performance.now()
    this.startLoop()
    this.onFrameChange?.(this.state)
  }

  pause(): void {
    if (!this.state.isPlaying) return
    this.state.isPlaying = false
    this.stopLoop()
    this.onFrameChange?.(this.state)
  }

  toggle(): void {
    if (this.state.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  stop(): void {
    this.state.isPlaying = false
    this.state.currentFrameIndex = 0
    this.stopLoop()
    this.onFrameChange?.(this.state)
  }

  nextFrame(totalFrames: number): void {
    this.state.currentFrameIndex = (this.state.currentFrameIndex + 1) % totalFrames
    this.onFrameChange?.(this.state)
  }

  previousFrame(totalFrames: number): void {
    this.state.currentFrameIndex =
      (this.state.currentFrameIndex - 1 + totalFrames) % totalFrames
    this.onFrameChange?.(this.state)
  }

  goToFrame(index: number): void {
    this.state.currentFrameIndex = index
    this.onFrameChange?.(this.state)
  }

  setAnimation(animationId: string | null): void {
    this.state.currentAnimationId = animationId
    this.state.currentFrameIndex = 0
    this.onFrameChange?.(this.state)
  }

  setFps(fps: number): void {
    this.state.fps = Math.max(1, Math.min(60, fps))
  }

  private startLoop(): void {
    const loop = (currentTime: number) => {
      if (!this.state.isPlaying) return

      const frameDuration = 1000 / this.state.fps
      const elapsed = currentTime - this.lastFrameTime

      if (elapsed >= frameDuration) {
        this.lastFrameTime = currentTime - (elapsed % frameDuration)

        // Advance to next frame
        if (this.totalFrames > 0) {
          if (this.state.loop) {
            this.state.currentFrameIndex = (this.state.currentFrameIndex + 1) % this.totalFrames
          } else {
            // Check if we're at the last frame before advancing
            if (this.state.currentFrameIndex >= this.totalFrames - 1) {
              // We're already at the last frame, stop playing
              this.state.isPlaying = false
              this.onFrameChange?.(this.state)
              return // Don't request another frame
            }
            this.state.currentFrameIndex = Math.min(this.state.currentFrameIndex + 1, this.totalFrames - 1)
          }
        }

        this.onFrameChange?.(this.state)
      }

      this.animationFrameId = requestAnimationFrame(loop)
    }

    this.animationFrameId = requestAnimationFrame(loop)
  }

  private stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  dispose(): void {
    this.state.isPlaying = false
    this.stopLoop()
    this.onFrameChange = undefined
  }
}

export function getCurrentFrame(
  state: PlaybackState,
  frames: Frame[],
  animations: AnimationGroup[]
): Frame | null {
  if (frames.length === 0) return null

  if (state.currentAnimationId) {
    const animation = animations.find((a) => a.id === state.currentAnimationId)
    if (animation && animation.frameIds.length > 0) {
      const frameId = animation.frameIds[state.currentFrameIndex % animation.frameIds.length]
      return frames.find((f) => f.id === frameId) || null
    }
  }

  return frames[state.currentFrameIndex % frames.length] || null
}

export function getOnionSkinFrames(
  state: PlaybackState,
  frames: Frame[],
  animations: AnimationGroup[]
): Frame[] {
  if (!state.onionSkinEnabled || frames.length === 0) return []

  const result: Frame[] = []
  const currentFrame = getCurrentFrame(state, frames, animations)
  if (!currentFrame) return result

  let frameList: Frame[] = frames
  if (state.currentAnimationId) {
    const animation = animations.find((a) => a.id === state.currentAnimationId)
    if (animation) {
      frameList = animation.frameIds
        .map((id) => frames.find((f) => f.id === id))
        .filter((f): f is Frame => f !== undefined)
    }
  }

  const currentIndex = frameList.indexOf(currentFrame)
  if (currentIndex === -1) return result

  for (let i = 1; i <= 3; i++) {
    const beforeIndex = currentIndex - i
    if (beforeIndex >= 0) {
      result.push(frameList[beforeIndex])
    }
  }

  return result
}

export function renderFrame(frame: Frame, ctx: CanvasRenderingContext2D): void {
  if (!frame.imageData) return

  ctx.putImageData(frame.imageData, 0, 0)
}

export function renderOnionSkin(
  frames: Frame[],
  ctx: CanvasRenderingContext2D,
  opacity: number
): void {
  ctx.save()
  ctx.globalAlpha = opacity

  for (const frame of frames) {
    if (frame.imageData) {
      ctx.putImageData(frame.imageData, 0, 0)
    }
  }

  ctx.restore()
}

export function renderSkeletalMarkers(
  markers: SkeletalMarkers,
  ctx: CanvasRenderingContext2D,
  scale: number = 1
): void {
  const markerColors: Record<keyof SkeletalMarkers, string> = {
    pelvis: '#FF6B6B',
    head: '#4ECDC4',
    leftHand: '#FFE66D',
    rightHand: '#95E1D3',
    leftFoot: '#F38181',
    rightFoot: '#AA96DA',
  }

  const markerSizes: Record<keyof SkeletalMarkers, number> = {
    pelvis: 8,
    head: 10,
    leftHand: 6,
    rightHand: 6,
    leftFoot: 6,
    rightFoot: 6,
  }

  ctx.save()

  for (const [key, point] of Object.entries(markers) as [keyof SkeletalMarkers, { x: number; y: number }][]) {
    const color = markerColors[key]
    const size = markerSizes[key] * scale

    ctx.beginPath()
    ctx.arc(point.x * scale, point.y * scale, size, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
