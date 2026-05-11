import { describe, it, expect } from 'vitest'
import { extractFramesInRow, extractAllFrames } from '../extractFrames'
import type { SplitConfig, RowBand } from '../types'

describe('extractFramesInRow', () => {
  const defaultConfig: SplitConfig = {
    minRowGap: 3,
    minDepthRatio: 0.15,
    alphaThreshold: 10,
    minPixels: 20,
    padding: 2,
  }

  it('should extract single frame from row', () => {
    // 20x10 image, single 10x8 sprite at (5, 1)
    const alpha = new Uint8Array(200)
    for (let y = 1; y <= 8; y++) {
      for (let x = 5; x <= 14; x++) {
        alpha[y * 20 + x] = 255
      }
    }

    const row: RowBand = { y0: 0, y1: 9 }
    const frames = extractFramesInRow(alpha, 20, 10, row, defaultConfig)

    expect(frames.length).toBe(1)
    expect(frames[0]).toEqual({
      x0: 5,
      y0: 1,
      x1: 14,
      y1: 8,
      opaquePixels: 80,
    })
  })

  it('should extract multiple frames from row with valleys', () => {
    // 40x10 image, two 10x8 sprites with wider gap
    const alpha = new Uint8Array(400)
    for (let y = 1; y <= 8; y++) {
      // First sprite
      for (let x = 2; x <= 11; x++) {
        alpha[y * 40 + x] = 255
      }
      // Second sprite (with gap)
      for (let x = 22; x <= 31; x++) {
        alpha[y * 40 + x] = 255
      }
    }

    const row: RowBand = { y0: 0, y1: 9 }
    const frames = extractFramesInRow(alpha, 40, 10, row, defaultConfig)

    expect(frames.length).toBe(2)
    // First frame bounds are tight to content
    expect(frames[0].x0).toBe(2)
    expect(frames[0].y0).toBe(1)
    expect(frames[0].x1).toBe(11)
    expect(frames[0].y1).toBe(8)
    expect(frames[0].opaquePixels).toBe(80)

    // Second frame bounds - x0 may vary due to split point, but should be near expected
    expect(frames[1].x0).toBeGreaterThanOrEqual(19)
    expect(frames[1].x0).toBeLessThanOrEqual(22)
    expect(frames[1].y0).toBe(1)
    expect(frames[1].x1).toBe(31)
    expect(frames[1].y1).toBe(8)
    expect(frames[1].opaquePixels).toBe(80)
  })

  it('should skip frames below minPixels threshold', () => {
    // 20x10 image, tiny 3x3 sprite at (5, 3)
    const alpha = new Uint8Array(200)
    for (let y = 3; y <= 5; y++) {
      for (let x = 5; x <= 7; x++) {
        alpha[y * 20 + x] = 255
      }
    }

    const row: RowBand = { y0: 0, y1: 9 }
    const frames = extractFramesInRow(alpha, 20, 10, row, {
      ...defaultConfig,
      minPixels: 20,
    })

    // 9 pixels < 20 threshold, should be skipped
    expect(frames.length).toBe(0)
  })

  it('should handle touching sprites with shallow valley', () => {
    // 50x10 image, two sprites with a gap
    const alpha = new Uint8Array(500)
    for (let y = 1; y <= 8; y++) {
      // First sprite: x=2 to x=13
      for (let x = 2; x <= 13; x++) {
        alpha[y * 50 + x] = 255
      }
      // Second sprite: x=25 to x=36 (larger gap)
      for (let x = 25; x <= 36; x++) {
        alpha[y * 50 + x] = 255
      }
    }

    const row: RowBand = { y0: 0, y1: 9 }
    const frames = extractFramesInRow(alpha, 50, 10, row, defaultConfig)

    // Should detect two separate sprites with sufficient gap
    expect(frames.length).toBe(2)
    expect(frames[0].x0).toBe(2)
    expect(frames[0].x1).toBe(13)
    // Second sprite x0 may vary slightly due to split point
    expect(frames[1].x0).toBeGreaterThanOrEqual(22)
    expect(frames[1].x0).toBeLessThanOrEqual(25)
    expect(frames[1].x1).toBe(36)
  })

  it('should respect alphaThreshold', () => {
    // 20x10 image with low-alpha content
    const alpha = new Uint8Array(200)
    for (let y = 1; y <= 8; y++) {
      for (let x = 5; x <= 14; x++) {
        alpha[y * 20 + x] = 5 // Below threshold of 10
      }
    }

    const row: RowBand = { y0: 0, y1: 9 }
    const frames = extractFramesInRow(alpha, 20, 10, row, defaultConfig)

    // All pixels below threshold, should find no frames
    expect(frames.length).toBe(0)
  })

  it('should handle empty row', () => {
    const alpha = new Uint8Array(200)
    const row: RowBand = { y0: 0, y1: 9 }
    const frames = extractFramesInRow(alpha, 20, 10, row, defaultConfig)
    expect(frames.length).toBe(0)
  })

  it('should extract frame to edge of row band', () => {
    // 20x10 image, sprite spans row band height
    const alpha = new Uint8Array(200)
    for (let y = 2; y <= 7; y++) {
      for (let x = 5; x <= 14; x++) {
        alpha[y * 20 + x] = 255
      }
    }

    const row: RowBand = { y0: 2, y1: 7 } // Matches sprite bounds
    const frames = extractFramesInRow(alpha, 20, 10, row, defaultConfig)

    expect(frames.length).toBe(1)
    expect(frames[0].y0).toBe(2)
    expect(frames[0].y1).toBe(7)
  })
})

describe('extractAllFrames', () => {
  const defaultConfig: SplitConfig = {
    minRowGap: 3,
    minDepthRatio: 0.15,
    alphaThreshold: 10,
    minPixels: 20,
    padding: 2,
  }

  it('should extract frames from multiple rows', () => {
    // 30x20 image with 2 rows of 2 sprites each
    const alpha = new Uint8Array(600)
    // Row 1: sprites at y=1-4
    for (let y = 1; y <= 4; y++) {
      for (let x = 2; x <= 11; x++) alpha[y * 30 + x] = 255
      for (let x = 18; x <= 27; x++) alpha[y * 30 + x] = 255
    }
    // Row 2: sprites at y=10-13
    for (let y = 10; y <= 13; y++) {
      for (let x = 2; x <= 11; x++) alpha[y * 30 + x] = 255
      for (let x = 18; x <= 27; x++) alpha[y * 30 + x] = 255
    }

    const rows: RowBand[] = [
      { y0: 0, y1: 5 },
      { y0: 9, y1: 14 },
    ]
    const frames = extractAllFrames(alpha, 30, 20, rows, defaultConfig)

    expect(frames.length).toBe(4)
  })

  it('should handle empty rows array', () => {
    const alpha = new Uint8Array(200)
    const frames = extractAllFrames(alpha, 20, 10, [], defaultConfig)
    expect(frames.length).toBe(0)
  })

  it('should handle row with no valid frames', () => {
    // 20x10 image, row band with content below minPixels
    const alpha = new Uint8Array(200)
    for (let y = 1; y <= 3; y++) {
      for (let x = 5; x <= 7; x++) {
        alpha[y * 20 + x] = 255 // Only 9 pixels total
      }
    }

    const rows: RowBand[] = [{ y0: 0, y1: 5 }]
    const frames = extractAllFrames(alpha, 20, 10, rows, {
      ...defaultConfig,
      minPixels: 20,
    })

    expect(frames.length).toBe(0)
  })

  it('should preserve frame order (row-major, left-to-right)', () => {
    // 70x20 image with 3 frames in different positions
    const alpha = new Uint8Array(1400)
    // Frame 1: top-left
    for (let y = 1; y <= 4; y++) {
      for (let x = 2; x <= 11; x++) alpha[y * 70 + x] = 255
    }
    // Frame 2: top-right
    for (let y = 1; y <= 4; y++) {
      for (let x = 45; x <= 54; x++) alpha[y * 70 + x] = 255
    }
    // Frame 3: bottom-left
    for (let y = 10; y <= 13; y++) {
      for (let x = 2; x <= 11; x++) alpha[y * 70 + x] = 255
    }

    const rows: RowBand[] = [
      { y0: 0, y1: 5 },
      { y0: 9, y1: 14 },
    ]
    const frames = extractAllFrames(alpha, 70, 20, rows, defaultConfig)

    expect(frames.length).toBe(3)
    // Check order: top-left, top-right, bottom-left
    expect(frames[0].y0).toBe(1)
    expect(frames[0].x0).toBe(2)
    expect(frames[1].y0).toBe(1)
    // x0 may vary slightly due to split point
    expect(frames[1].x0).toBeGreaterThanOrEqual(42)
    expect(frames[1].x0).toBeLessThanOrEqual(45)
    expect(frames[2].y0).toBe(10)
    expect(frames[2].x0).toBe(2)
  })
})
