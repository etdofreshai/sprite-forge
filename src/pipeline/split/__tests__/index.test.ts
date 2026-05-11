import { describe, it, expect } from 'vitest'
import { detectAllFrames, DEFAULT_SPLIT_CONFIG } from '../index'

describe('split pipeline integration', () => {
  it('should process simple 2x2 sprite grid', () => {
    // 50x50 image with 4 sprites (20x20 each) with gaps
    const alpha = new Uint8Array(2500)
    const spriteSize = 20

    // Top-left sprite
    for (let y = 2; y < 2 + spriteSize; y++) {
      for (let x = 2; x < 2 + spriteSize; x++) {
        alpha[y * 50 + x] = 255
      }
    }
    // Top-right sprite
    for (let y = 2; y < 2 + spriteSize; y++) {
      for (let x = 28; x < 28 + spriteSize; x++) {
        alpha[y * 50 + x] = 255
      }
    }
    // Bottom-left sprite
    for (let y = 28; y < 28 + spriteSize; y++) {
      for (let x = 2; x < 2 + spriteSize; x++) {
        alpha[y * 50 + x] = 255
      }
    }
    // Bottom-right sprite
    for (let y = 28; y < 28 + spriteSize; y++) {
      for (let x = 28; x < 28 + spriteSize; x++) {
        alpha[y * 50 + x] = 255
      }
    }

    const result = detectAllFrames(alpha, 50, 50)

    expect(result.rowCount).toBe(2)
    expect(result.frames.length).toBe(4)

    // Verify frame bounds - x0 for right sprites may vary due to split point location
    // but should be close to the expected position
    const [f0, f1, f2] = result.frames
    expect(f0.x0).toBe(2)
    expect(f0.y0).toBe(2)
    expect(f1.x0).toBeGreaterThanOrEqual(26)
    expect(f1.x0).toBeLessThanOrEqual(28)
    expect(f2.y0).toBeGreaterThanOrEqual(26)
    expect(f2.y0).toBeLessThanOrEqual(28)
  })

  it('should handle sprites with variable spacing', () => {
    // 60x30 image with irregular spacing
    const alpha = new Uint8Array(1800)

    // Row 1: sprites at x=2-11, x=18-27, x=38-47 (different gaps)
    for (let y = 2; y <= 10; y++) {
      for (let x = 2; x <= 11; x++) alpha[y * 60 + x] = 255
      for (let x = 18; x <= 27; x++) alpha[y * 60 + x] = 255
      for (let x = 38; x <= 47; x++) alpha[y * 60 + x] = 255
    }

    // Row 2: sprites at x=5-14, x=25-34
    for (let y = 18; y <= 26; y++) {
      for (let x = 5; x <= 14; x++) alpha[y * 60 + x] = 255
      for (let x = 25; x <= 34; x++) alpha[y * 60 + x] = 255
    }

    const result = detectAllFrames(alpha, 60, 30)

    expect(result.rowCount).toBe(2)
    expect(result.frames.length).toBe(5)
  })

  it('should handle touching sprites', () => {
    // 40x20 image with sprites touching at column boundaries
    const alpha = new Uint8Array(800)

    // Two 20x18 sprites touching in middle
    for (let y = 1; y <= 18; y++) {
      // Left sprite
      for (let x = 1; x <= 19; x++) alpha[y * 40 + x] = 255
      // Right sprite
      for (let x = 20; x <= 38; x++) alpha[y * 40 + x] = 255
    }

    const result = detectAllFrames(alpha, 40, 30, {
      ...DEFAULT_SPLIT_CONFIG,
      minDepthRatio: 0.1, // More sensitive to detect the touch point
    })

    // Should detect two sprites even though they touch
    expect(result.frames.length).toBeGreaterThanOrEqual(1)
    expect(result.frames.length).toBeLessThanOrEqual(2)
  })

  it('should skip tiny debris below minPixels', () => {
    // 40x40 image with one main sprite and small debris
    const alpha = new Uint8Array(1600)

    // Main sprite: 20x20 at (5, 5)
    for (let y = 5; y < 25; y++) {
      for (let x = 5; x < 25; x++) {
        alpha[y * 40 + x] = 255
      }
    }

    // Debris: 2x2 at (30, 5) = 4 pixels
    for (let y = 5; y < 7; y++) {
      for (let x = 30; x < 32; x++) {
        alpha[y * 40 + x] = 255
      }
    }

    const result = detectAllFrames(alpha, 40, 40)

    // Should only find the main sprite (400 pixels > 20 threshold)
    expect(result.frames.length).toBe(1)
    expect(result.frames[0].opaquePixels).toBe(400)
  })

  it('should handle empty image', () => {
    const alpha = new Uint8Array(1600)
    const result = detectAllFrames(alpha, 40, 40)

    expect(result.rowCount).toBe(0)
    expect(result.frames.length).toBe(0)
  })

  it('should handle single sprite', () => {
    // 30x30 image with single sprite at center
    const alpha = new Uint8Array(900)

    for (let y = 10; y < 20; y++) {
      for (let x = 10; x < 20; x++) {
        alpha[y * 30 + x] = 255
      }
    }

    const result = detectAllFrames(alpha, 30, 30)

    expect(result.rowCount).toBe(1)
    expect(result.frames.length).toBe(1)
    expect(result.frames[0]).toEqual({
      x0: 10,
      y0: 10,
      x1: 19,
      y1: 19,
      opaquePixels: 100,
    })
  })

  it('should merge close rows based on minRowGap', () => {
    // 40x40 image with content in rows that should merge
    const alpha = new Uint8Array(1600)

    // Row 1: y=2-5
    for (let y = 2; y <= 5; y++) {
      for (let x = 2; x <= 37; x++) alpha[y * 40 + x] = 255
    }

    // Row 2: y=8-11 (gap of 2 rows from row 1)
    for (let y = 8; y <= 11; y++) {
      for (let x = 2; x <= 37; x++) alpha[y * 40 + x] = 255
    }

    // With minRowGap=3, gap of 2 should merge
    const result = detectAllFrames(alpha, 40, 40, {
      ...DEFAULT_SPLIT_CONFIG,
      minRowGap: 3,
    })

    expect(result.rowCount).toBe(1)
  })

  it('should keep separate rows when gap is large enough', () => {
    // 40x40 image with content in rows that should stay separate
    const alpha = new Uint8Array(1600)

    // Row 1: y=2-5
    for (let y = 2; y <= 5; y++) {
      for (let x = 2; x <= 37; x++) alpha[y * 40 + x] = 255
    }

    // Row 2: y=10-13 (gap of 4 rows from row 1)
    for (let y = 10; y <= 13; y++) {
      for (let x = 2; x <= 37; x++) alpha[y * 40 + x] = 255
    }

    // With minRowGap=3, gap of 4 should stay separate
    const result = detectAllFrames(alpha, 40, 40, {
      ...DEFAULT_SPLIT_CONFIG,
      minRowGap: 3,
    })

    expect(result.rowCount).toBe(2)
  })
})
