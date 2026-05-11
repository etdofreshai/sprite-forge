/**
 * Configuration for the sprite sheet splitting algorithm.
 */
export interface SplitConfig {
  /**
   * Minimum gap (in pixels) between row bands to consider them separate.
   * Rows with smaller gaps will be merged.
   */
  minRowGap: number

  /**
   * Valley depth ratio for column split detection.
   * Lower values = more splits (sensitive to small gaps).
   * Higher values = fewer splits (only deep valleys trigger splits).
   * Typical range: 0.1 to 0.3
   */
  minDepthRatio: number

  /**
   * Alpha threshold (0-255) to consider a pixel opaque.
   * Pixels with alpha > this value are considered part of the sprite content.
   */
  alphaThreshold: number

  /**
   * Minimum number of opaque pixels required for a region to be considered a valid sprite.
   */
  minPixels: number

  /**
   * Padding (in pixels) to add around each extracted sprite.
   */
  padding: number
}

/**
 * A horizontal band containing one or more rows of sprite content.
 */
export interface RowBand {
  /** Starting Y coordinate (inclusive) */
  y0: number
  /** Ending Y coordinate (inclusive) */
  y1: number
}

/**
 * A detected sprite frame with its bounding box and metadata.
 */
export interface DetectedFrame {
  /** Left X coordinate (inclusive) */
  x0: number
  /** Top Y coordinate (inclusive) */
  y0: number
  /** Right X coordinate (inclusive) */
  x1: number
  /** Bottom Y coordinate (inclusive) */
  y1: number
  /** Number of opaque pixels in the frame */
  opaquePixels: number
}

/**
 * Result of the split detection operation.
 */
export interface SplitResult {
  /** All detected frames */
  frames: DetectedFrame[]
  /** Number of row bands detected */
  rowCount: number
}
