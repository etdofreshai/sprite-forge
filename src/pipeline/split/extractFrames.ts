import type { SplitConfig, DetectedFrame, RowBand } from './types'
import { detectSplitPoints } from './detectSplitPoints'

/**
 * Extract sprite frames from a row band using column valley detection.
 *
 * @param alpha - Alpha channel as Uint8Array (flattened row-major)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param row - Row band to process
 * @param config - Split configuration
 * @returns Array of detected frames within this row
 */
export function extractFramesInRow(
  alpha: Uint8Array,
  width: number,
  _height: number,
  row: RowBand,
  config: SplitConfig
): DetectedFrame[] {
  const frames: DetectedFrame[] = []
  const rowHeight = row.y1 - row.y0 + 1

  // Build row mask and column profile
  const rowMask = new Uint8Array(rowHeight * width)
  const colProfile = new Uint32Array(width)

  for (let y = 0; y < rowHeight; y++) {
    const globalY = row.y0 + y
    const rowStart = y * width
    const globalRowStart = globalY * width

    for (let x = 0; x < width; x++) {
      const hasAlpha = alpha[globalRowStart + x] > config.alphaThreshold ? 1 : 0
      rowMask[rowStart + x] = hasAlpha
      colProfile[x] += hasAlpha
    }
  }

  // Find split points (valleys in the column profile)
  const splits = detectSplitPoints(colProfile, config.minDepthRatio)

  // Build column bands from split points
  const colBands = buildColumnBands(splits, width)

  // Extract frames from each column band
  for (const [c0, c1] of colBands) {
    const frame = extractFrameFromBand(
      rowMask,
      width,
      row,
      c0,
      c1,
      config.minPixels
    )
    if (frame) {
      frames.push(frame)
    }
  }

  return frames
}

/**
 * Build column bands from split points.
 *
 * Split points represent the valley column indices; the actual split boundary
 * is between columns. A band goes up to (but not including) the split point.
 *
 * @param splits - Array of split column indices (valley locations)
 * @param width - Image width
 * @returns Array of [start, end] inclusive column pairs
 */
function buildColumnBands(splits: number[], width: number): [number, number][] {
  const bands: [number, number][] = []

  if (splits.length === 0) {
    // Entire row is one band
    bands.push([0, width - 1])
    return bands
  }

  // First band: from start to before first split
  if (splits[0] > 0) {
    bands.push([0, splits[0] - 1])
  }

  // Middle bands: between splits
  for (let i = 1; i < splits.length; i++) {
    const start = splits[i - 1] + 1
    const end = splits[i] - 1
    if (start <= end) {
      bands.push([start, end])
    }
  }

  // Last band: from after last split to end
  const lastSplit = splits[splits.length - 1]
  if (lastSplit + 1 < width) {
    bands.push([lastSplit + 1, width - 1])
  }

  return bands
}

/**
 * Extract a single frame from a column band within a row.
 *
 * @param rowMask - Mask for the current row (flattened)
 * @param width - Image width
 * @param row - Row band coordinates
 * @param c0 - Column start (inclusive)
 * @param c1 - Column end (inclusive)
 * @param minPixels - Minimum opaque pixels required
 * @returns Detected frame or null if invalid
 */
function extractFrameFromBand(
  rowMask: Uint8Array,
  width: number,
  row: RowBand,
  c0: number,
  c1: number,
  minPixels: number
): DetectedFrame | null {
  const rowHeight = row.y1 - row.y0 + 1
  const bandWidth = c1 - c0 + 1

  // Find actual content bounds within the band
  let minX = bandWidth,
    maxX = -1,
    minY = rowHeight,
    maxY = -1
  let opaqueCount = 0

  for (let y = 0; y < rowHeight; y++) {
    for (let x = c0; x <= c1; x++) {
      const maskIdx = y * width + x
      if (rowMask[maskIdx] !== 0) {
        opaqueCount++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // Check if we have enough content
  if (opaqueCount < minPixels || minX > maxX) {
    return null
  }

  return {
    x0: minX,
    y0: row.y0 + minY,
    x1: maxX,
    y1: row.y0 + maxY,
    opaquePixels: opaqueCount,
  }
}

/**
 * Extract all frames from the entire sprite sheet.
 *
 * @param alpha - Alpha channel as Uint8Array (flattened row-major)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param rows - Array of row bands
 * @param config - Split configuration
 * @returns Array of all detected frames
 */
export function extractAllFrames(
  alpha: Uint8Array,
  width: number,
  height: number,
  rows: RowBand[],
  config: SplitConfig
): DetectedFrame[] {
  const allFrames: DetectedFrame[] = []

  for (const row of rows) {
    const frames = extractFramesInRow(alpha, width, height, row, config)
    allFrames.push(...frames)
  }

  return allFrames
}
