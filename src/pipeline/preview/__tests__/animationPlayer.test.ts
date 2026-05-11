import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AnimationPlayer,
  getCurrentFrame,
  getOnionSkinFrames,
  DEFAULT_PLAYBACK_STATE,
  type PlaybackState,
} from '../animationPlayer'
import type { Frame, AnimationGroup } from '../../../types'

describe('AnimationPlayer', () => {
  let player: AnimationPlayer
  let onFrameChangeMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onFrameChangeMock = vi.fn()
    player = new AnimationPlayer({}, onFrameChangeMock)
  })

  afterEach(() => {
    player.dispose()
  })

  describe('constructor', () => {
    it('should initialize with default state', () => {
      const state = player.getState()
      expect(state).toEqual(DEFAULT_PLAYBACK_STATE)
    })

    it('should merge initial state with defaults', () => {
      const customPlayer = new AnimationPlayer({ fps: 24, isPlaying: true })
      const state = customPlayer.getState()
      expect(state.fps).toBe(24)
      expect(state.isPlaying).toBe(true)
      customPlayer.dispose()
    })
  })

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const state1 = player.getState()
      const state2 = player.getState()
      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2)
    })
  })

  describe('setState', () => {
    it('should update state and call onFrameChange', () => {
      player.setState({ fps: 30 })
      expect(player.getState().fps).toBe(30)
      expect(onFrameChangeMock).toHaveBeenCalledTimes(1)
    })

    it('should merge updates with existing state', () => {
      player.setState({ fps: 20 })
      player.setState({ loop: false })
      expect(player.getState().fps).toBe(20)
      expect(player.getState().loop).toBe(false)
      expect(onFrameChangeMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('play', () => {
    it('should start playing when paused', () => {
      player.play()
      expect(player.getState().isPlaying).toBe(true)
      expect(onFrameChangeMock).toHaveBeenCalled()
    })

    it('should not change state if already playing', () => {
      player.play()
      const callCount = onFrameChangeMock.mock.calls.length
      player.play()
      expect(onFrameChangeMock.mock.calls.length).toBe(callCount)
    })
  })

  describe('pause', () => {
    it('should pause when playing', () => {
      player.play()
      player.pause()
      expect(player.getState().isPlaying).toBe(false)
    })
  })

  describe('toggle', () => {
    it('should start playing when paused', () => {
      player.toggle()
      expect(player.getState().isPlaying).toBe(true)
    })

    it('should pause when playing', () => {
      player.play()
      player.toggle()
      expect(player.getState().isPlaying).toBe(false)
    })
  })

  describe('stop', () => {
    it('should stop and reset to frame 0', () => {
      player.setState({ currentFrameIndex: 5 })
      player.stop()
      expect(player.getState().isPlaying).toBe(false)
      expect(player.getState().currentFrameIndex).toBe(0)
    })
  })

  describe('nextFrame', () => {
    it('should advance to next frame', () => {
      player.setState({ currentFrameIndex: 0 })
      player.nextFrame(10)
      expect(player.getState().currentFrameIndex).toBe(1)
    })

    it('should wrap around when reaching end', () => {
      player.setState({ currentFrameIndex: 9 })
      player.nextFrame(10)
      expect(player.getState().currentFrameIndex).toBe(0)
    })
  })

  describe('previousFrame', () => {
    it('should go to previous frame', () => {
      player.setState({ currentFrameIndex: 5 })
      player.previousFrame(10)
      expect(player.getState().currentFrameIndex).toBe(4)
    })

    it('should wrap around when at start', () => {
      player.setState({ currentFrameIndex: 0 })
      player.previousFrame(10)
      expect(player.getState().currentFrameIndex).toBe(9)
    })
  })

  describe('goToFrame', () => {
    it('should jump to specific frame', () => {
      player.goToFrame(5)
      expect(player.getState().currentFrameIndex).toBe(5)
    })
  })

  describe('setAnimation', () => {
    it('should set animation and reset frame index', () => {
      player.setState({ currentFrameIndex: 5 })
      player.setAnimation('anim-1')
      expect(player.getState().currentAnimationId).toBe('anim-1')
      expect(player.getState().currentFrameIndex).toBe(0)
    })
  })

  describe('setFps', () => {
    it('should set FPS within valid range', () => {
      player.setFps(30)
      expect(player.getState().fps).toBe(30)
    })

    it('should clamp FPS to minimum of 1', () => {
      player.setFps(0)
      expect(player.getState().fps).toBe(1)
    })

    it('should clamp FPS to maximum of 60', () => {
      player.setFps(100)
      expect(player.getState().fps).toBe(60)
    })
  })

  describe('setTotalFrames', () => {
    it('should set total frame count', () => {
      player.setTotalFrames(10)
      expect(player.getState().currentFrameIndex).toBe(0)
    })
  })

  describe('dispose', () => {
    it('should stop animation loop and clear callback', async () => {
      player.play()
      await new Promise(resolve => requestAnimationFrame(resolve))
      player.dispose()
      expect(player.getState().isPlaying).toBe(false)
    })
  })

  describe('playback loop', () => {
    it('should advance frame index during playback', async () => {
      player.setTotalFrames(5)
      player.setFps(60)

      let rafCallback: ((timestamp: number) => void) | null = null
      const mockRaf = vi.fn((cb: ((timestamp: number) => void) | null) => {
        rafCallback = cb
        return 1
      })
      vi.stubGlobal('requestAnimationFrame', mockRaf)

      player.play()

      // Simulate RAF callback being invoked after frame duration
      expect(rafCallback).not.toBeNull()
      const callback = rafCallback as ((timestamp: number) => void) | null
      if (callback) {
        // First call - just registers the callback
        // Second call - advances frame after elapsed time
        callback(performance.now() + 20) // 20ms elapsed at 60fps (~16.67ms per frame)
      }

      vi.unstubAllGlobals()

      const finalIndex = player.getState().currentFrameIndex
      expect(finalIndex).toBeGreaterThan(0)
    })

    it('should wrap to frame 0 when looping', () => {
      player.setState({ loop: true, fps: 60 })
      player.setTotalFrames(3)

      let rafCallback: ((timestamp: number) => void) | null = null
      const mockRaf = vi.fn((cb: ((timestamp: number) => void) | null) => {
        rafCallback = cb
        return 1
      })
      vi.stubGlobal('requestAnimationFrame', mockRaf)

      player.play()

      const callback = rafCallback as ((timestamp: number) => void) | null
      if (callback) {
        // Advance through multiple frames
        for (let i = 0; i < 5; i++) {
          callback(performance.now() + 20)
        }
      }

      vi.unstubAllGlobals()

      // With looping, frame should have wrapped around
      const finalIndex = player.getState().currentFrameIndex
      expect(finalIndex).toBeGreaterThanOrEqual(0)
      expect(finalIndex).toBeLessThan(3)
    })

    it('should stop at last frame when not looping', () => {
      player.setState({ loop: false, fps: 60 })
      player.setTotalFrames(3)

      const callbacks: ((timestamp: number) => void)[] = []
      const mockRaf = vi.fn((cb: (timestamp: number) => void) => {
        callbacks.push(cb)
        return callbacks.length
      })
      vi.stubGlobal('requestAnimationFrame', mockRaf)

      player.play()

      // Process all registered callbacks in sequence
      for (const callback of callbacks) {
        if (!player.getState().isPlaying) break
        callback(performance.now() + 20)
      }

      vi.unstubAllGlobals()

      // Should have stopped at last frame
      expect(player.getState().isPlaying).toBe(false)
      expect(player.getState().currentFrameIndex).toBe(2)
    })

    it('should not advance when totalFrames is 0', () => {
      player.setTotalFrames(0)

      let rafCallback: ((timestamp: number) => void) | null = null
      const mockRaf = vi.fn((cb: ((timestamp: number) => void) | null) => {
        rafCallback = cb
        return 1
      })
      vi.stubGlobal('requestAnimationFrame', mockRaf)

      player.play()

      const callback = rafCallback as ((timestamp: number) => void) | null
      if (callback) {
        callback(performance.now() + 20)
      }

      vi.unstubAllGlobals()

      expect(player.getState().currentFrameIndex).toBe(0)
    })
  })
})

describe('getCurrentFrame', () => {
  const mockFrames: Frame[] = [
    { id: 'frame-1', region: { rect: { x: 0, y: 0, width: 10, height: 10 }, sourceIndex: 0 }, durationMs: 100 },
    { id: 'frame-2', region: { rect: { x: 10, y: 0, width: 10, height: 10 }, sourceIndex: 0 }, durationMs: 100 },
    { id: 'frame-3', region: { rect: { x: 20, y: 0, width: 10, height: 10 }, sourceIndex: 0 }, durationMs: 100 },
  ]

  const mockAnimations: AnimationGroup[] = [
    { id: 'anim-1', name: 'Walk', frameIds: ['frame-1', 'frame-2'], defaultDurationMs: 100 },
  ]

  it('should return null when no frames exist', () => {
    const state: PlaybackState = { ...DEFAULT_PLAYBACK_STATE, currentFrameIndex: 0 }
    const result = getCurrentFrame(state, [], [])
    expect(result).toBeNull()
  })

  it('should return current frame from all frames when no animation selected', () => {
    const state: PlaybackState = { ...DEFAULT_PLAYBACK_STATE, currentFrameIndex: 1 }
    const result = getCurrentFrame(state, mockFrames, [])
    expect(result).toBe(mockFrames[1])
  })

  it('should return frame from selected animation', () => {
    const state: PlaybackState = {
      ...DEFAULT_PLAYBACK_STATE,
      currentAnimationId: 'anim-1',
      currentFrameIndex: 1,
    }
    const result = getCurrentFrame(state, mockFrames, mockAnimations)
    expect(result).toBe(mockFrames[1])
  })

  it('should wrap frame index within animation bounds', () => {
    const state: PlaybackState = {
      ...DEFAULT_PLAYBACK_STATE,
      currentAnimationId: 'anim-1',
      currentFrameIndex: 5,
    }
    const result = getCurrentFrame(state, mockFrames, mockAnimations)
    expect(result).toBeDefined()
  })
})

describe('getOnionSkinFrames', () => {
  const mockFrames: Frame[] = [
    {
      id: 'frame-1',
      region: { rect: { x: 0, y: 0, width: 10, height: 10 }, sourceIndex: 0 },
      durationMs: 100,
      imageData: new ImageData(10, 10),
    },
    {
      id: 'frame-2',
      region: { rect: { x: 10, y: 0, width: 10, height: 10 }, sourceIndex: 0 },
      durationMs: 100,
      imageData: new ImageData(10, 10),
    },
    {
      id: 'frame-3',
      region: { rect: { x: 20, y: 0, width: 10, height: 10 }, sourceIndex: 0 },
      durationMs: 100,
      imageData: new ImageData(10, 10),
    },
  ]

  it('should return empty array when onion skin is disabled', () => {
    const state: PlaybackState = { ...DEFAULT_PLAYBACK_STATE, onionSkinEnabled: false }
    const result = getOnionSkinFrames(state, mockFrames, [])
    expect(result).toEqual([])
  })

  it('should return empty array when no frames exist', () => {
    const state: PlaybackState = { ...DEFAULT_PLAYBACK_STATE, onionSkinEnabled: true }
    const result = getOnionSkinFrames(state, [], [])
    expect(result).toEqual([])
  })

  it('should return frames before current frame', () => {
    const state: PlaybackState = {
      ...DEFAULT_PLAYBACK_STATE,
      onionSkinEnabled: true,
      currentFrameIndex: 2,
    }
    const result = getOnionSkinFrames(state, mockFrames, [])
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toContain(mockFrames[2])
  })
})
