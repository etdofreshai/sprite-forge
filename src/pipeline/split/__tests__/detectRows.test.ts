import { describe, it, expect } from 'vitest'
import { detectRows, findBands } from '../detectRows'

describe('detectRows', () => {
  it('should find a single row band', () => {
    // 10x10 image with content in rows 2-5
    const alpha = new Uint8Array(100)
    for (let y = 2; y <= 5; y++) {
      for (let x = 0; x < 10; x++) {
        alpha[y * 10 + x] = 255
      }
    }

    const rows = detectRows(alpha, 10, 10, 2)
    expect(rows).toEqual([{ y0: 2, y1: 5 }])
  })

  it('should merge close row bands', () => {
    // Content in rows 2-3 and 5-6 (gap of 1 row)
    const alpha = new Uint8Array(100)
    for (let y of [2, 3, 5, 6]) {
      for (let x = 0; x < 10; x++) {
        alpha[y * 10 + x] = 255
      }
    }

    const rows = detectRows(alpha, 10, 10, 2) // minGap=2, so gap of 1 should merge
    expect(rows).toEqual([{ y0: 2, y1: 6 }])
  })

  it('should keep separate row bands when gap is large enough', () => {
    // Content in rows 2-3 and 6-7 (gap of 2 rows)
    const alpha = new Uint8Array(100)
    for (let y of [2, 3, 6, 7]) {
      for (let x = 0; x < 10; x++) {
        alpha[y * 10 + x] = 255
      }
    }

    const rows = detectRows(alpha, 10, 10, 2) // minGap=2, so gap of 2 should stay separate
    expect(rows).toEqual([
      { y0: 2, y1: 3 },
      { y0: 6, y1: 7 },
    ])
  })

  it('should handle empty image', () => {
    const alpha = new Uint8Array(100)
    const rows = detectRows(alpha, 10, 10, 2)
    expect(rows).toEqual([])
  })

  it('should handle full image', () => {
    const alpha = new Uint8Array(100).fill(255)
    const rows = detectRows(alpha, 10, 10, 2)
    expect(rows).toEqual([{ y0: 0, y1: 9 }])
  })

  it('should find multiple row bands', () => {
    // Content in rows 1-2, 5-6, 8-9
    const alpha = new Uint8Array(100)
    for (let y of [1, 2, 5, 6, 8, 9]) {
      for (let x = 0; x < 10; x++) {
        alpha[y * 10 + x] = 255
      }
    }

    const rows = detectRows(alpha, 10, 10, 1)
    expect(rows).toEqual([
      { y0: 1, y1: 2 },
      { y0: 5, y1: 6 },
      { y0: 8, y1: 9 },
    ])
  })
})

describe('findBands', () => {
  it('should find bands in profile', () => {
    const profile = new Uint8Array([0, 0, 1, 1, 1, 0, 0, 1, 1, 0])
    const bands = findBands(profile, 1)
    expect(bands).toEqual([
      { y0: 2, y1: 4 },
      { y0: 7, y1: 8 },
    ])
  })

  it('should merge adjacent bands when gap < minGap', () => {
    const profile = new Uint8Array([1, 1, 0, 1, 1])
    const bands = findBands(profile, 2) // gap of 1 should merge
    expect(bands).toEqual([{ y0: 0, y1: 4 }])
  })

  it('should keep bands separate when gap >= minGap', () => {
    const profile = new Uint8Array([1, 1, 0, 0, 1, 1])
    const bands = findBands(profile, 2) // gap of 2 should stay separate
    expect(bands).toEqual([
      { y0: 0, y1: 1 },
      { y0: 4, y1: 5 },
    ])
  })

  it('should handle empty profile', () => {
    const profile = new Uint8Array(10)
    const bands = findBands(profile, 1)
    expect(bands).toEqual([])
  })

  it('should handle profile with single band at start', () => {
    const profile = new Uint8Array([1, 1, 1, 0, 0])
    const bands = findBands(profile, 1)
    expect(bands).toEqual([{ y0: 0, y1: 2 }])
  })

  it('should handle profile with single band at end', () => {
    const profile = new Uint8Array([0, 0, 1, 1, 1])
    const bands = findBands(profile, 1)
    expect(bands).toEqual([{ y0: 2, y1: 4 }])
  })

  it('should handle all-ones profile', () => {
    const profile = new Uint8Array(10).fill(1)
    const bands = findBands(profile, 1)
    expect(bands).toEqual([{ y0: 0, y1: 9 }])
  })
})
