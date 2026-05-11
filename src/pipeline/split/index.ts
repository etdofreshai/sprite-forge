/**
 * Sprite sheet splitting pipeline using projection-based valley detection.
 *
 * This module detects individual sprite frames in a sprite sheet by:
 * 1. Finding horizontal row bands using Y-axis projection
 * 2. For each row, finding column split points using valley detection
 * 3. Extracting tight bounding boxes for each sprite
 *
 * Algorithm handles sprites that are:
 * - Not on a uniform grid
 * - Touching or bridging at pixel level
 * - Have variable spacing
 */

export type {
  SplitConfig,
  RowBand,
  DetectedFrame,
  SplitResult,
} from './types'

export { detectRows, findBands } from './detectRows'
export { detectSplitPoints } from './detectSplitPoints'
export {
  extractFramesInRow,
  extractAllFrames,
} from './extractFrames'
export { SplitPanel } from './index.tsx'

import type { SplitConfig, SplitResult } from './types'
import { detectRows } from './detectRows'
import { extractAllFrames } from './extractFrames'

/**
 * Default split configuration.
 */
export const DEFAULT_SPLIT_CONFIG: SplitConfig = {
  minRowGap: 3,
  minDepthRatio: 0.15,
  alphaThreshold: 10,
  minPixels: 20,
  padding: 2,
}

/**
 * Complete split detection pipeline.
 *
 * Takes an image's alpha channel and detects all sprite frames.
 *
 * @param alpha - Alpha channel as Uint8Array (flattened row-major)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param config - Split configuration (uses defaults if omitted)
 * @returns Split result with detected frames
 */
export function detectAllFrames(
  alpha: Uint8Array,
  width: number,
  height: number,
  config: Partial<SplitConfig> = {}
): SplitResult {
  const fullConfig: SplitConfig = { ...DEFAULT_SPLIT_CONFIG, ...config }

  // Step 1: Find row bands
  const rows = detectRows(alpha, width, height, fullConfig.minRowGap)

  // Step 2: Extract frames from each row
  const frames = extractAllFrames(alpha, width, height, rows, fullConfig)

  return {
    frames,
    rowCount: rows.length,
  }
}
