import type { RowBand } from './types'

/**
 * Find horizontal content bands (rows) using Y-axis projection.
 *
 * Projects alpha channel onto the Y axis to find rows containing sprite content,
 * then merges bands that are too close together.
 *
 * @param alpha - Alpha channel as Uint8Array (flattened row-major)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param minGap - Minimum gap between bands to keep them separate
 * @returns Array of row bands with (y0, y1) inclusive coordinates
 */
export function detectRows(
  alpha: Uint8Array,
  width: number,
  height: number,
  minGap: number
): RowBand[] {
  // Build row profile: for each row, does any pixel have alpha > 0?
  const rowProfile = new Uint8Array(height)
  for (let y = 0; y < height; y++) {
    let hasContent = false
    const rowStart = y * width
    for (let x = 0; x < width; x++) {
      if (alpha[rowStart + x] > 0) {
        hasContent = true
        break
      }
    }
    rowProfile[y] = hasContent ? 1 : 0
  }

  return findBands(rowProfile, minGap)
}

/**
 * Find content bands in a 1D profile array.
 *
 * A band is a contiguous run of non-zero values. Bands separated by gaps
 * smaller than minGap are merged.
 *
 * @param profile - 1D array where 1 = content, 0 = empty
 * @param minGap - Minimum gap to keep bands separate
 * @returns Array of (start, end) inclusive indices
 */
export function findBands(profile: Uint8Array, minGap: number): RowBand[] {
  const bands: RowBand[] = []
  const length = profile.length

  // Find transitions: 0->1 (band starts) and 1->0 (band ends)
  let inBand = false
  let bandStart = 0

  for (let i = 0; i < length; i++) {
    if (profile[i] !== 0 && !inBand) {
      bandStart = i
      inBand = true
    } else if (profile[i] === 0 && inBand) {
      bands.push({ y0: bandStart, y1: i - 1 })
      inBand = false
    }
  }

  // Handle band that extends to the end
  if (inBand) {
    bands.push({ y0: bandStart, y1: length - 1 })
  }

  // Merge bands separated by gaps smaller than minGap
  if (bands.length <= 1) {
    return bands
  }

  const merged: RowBand[] = [bands[0]]
  for (let i = 1; i < bands.length; i++) {
    const current = bands[i]
    const prev = merged[merged.length - 1]
    const gap = current.y0 - prev.y1 - 1

    if (gap < minGap) {
      // Merge with previous band
      merged[merged.length - 1] = { y0: prev.y0, y1: current.y1 }
    } else {
      // Keep separate
      merged.push(current)
    }
  }

  return merged
}
