/**
 * Find column split points by detecting valleys in a profile.
 *
 * A valley is a local minimum that is significantly lower than surrounding peaks.
 * This handles sprites that are touching or have bridging pixels between them.
 *
 * @param profile - 1D array of values (e.g., column pixel counts)
 * @param minDepthRatio - Valley depth ratio (0-1), lower = more splits
 * @returns Array of column indices where splits should occur
 */
export function detectSplitPoints(
  profile: Uint32Array,
  minDepthRatio: number
): number[] {
  const length = profile.length
  if (length === 0) {
    return []
  }

  // Smooth the profile to reduce noise
  const smoothed = smoothProfile(profile, length)

  // Find maximum value in smoothed profile
  let maxVal = 0
  for (let i = 0; i < length; i++) {
    if (smoothed[i] > maxVal) {
      maxVal = smoothed[i]
    }
  }

  if (maxVal === 0) {
    return []
  }

  // Find runs below threshold and split at minimum within each run
  const threshold = maxVal * minDepthRatio
  const splits: number[] = []

  let inRun = false
  let runStart = 0

  for (let i = 0; i < length; i++) {
    if (smoothed[i] < threshold && !inRun) {
      runStart = i
      inRun = true
    } else if (smoothed[i] >= threshold && inRun) {
      // End of a below-threshold run - split at minimum within it
      const runEnd = i - 1
      // Only add split if valley is not at the very edge (touches edge but isn't the whole profile)
      if (runStart > 0 && runEnd < length - 1) {
        const minIdx = findMinimumIndex(smoothed, runStart, runEnd)
        splits.push(minIdx)
      }
      inRun = false
    }
  }

  // Handle run that extends to the end
  if (inRun) {
    // Only add if valley doesn't touch both edges
    if (runStart > 0 && runStart < length - 1) {
      const minIdx = findMinimumIndex(smoothed, runStart, length - 1)
      splits.push(minIdx)
    }
  }

  return splits
}

/**
 * Apply moving average smoothing to reduce noise.
 *
 * @param profile - Input profile array
 * @param length - Length of profile
 * @returns Smoothed profile as Float32Array
 */
function smoothProfile(profile: Uint32Array, length: number): Float32Array {
  // Calculate kernel size based on profile length
  let kernelSize = Math.max(3, Math.floor(length / 30))
  if (kernelSize % 2 === 0) {
    kernelSize++
  }

  const halfKernel = Math.floor(kernelSize / 2)
  const smoothed = new Float32Array(length)

  for (let i = 0; i < length; i++) {
    let sum = 0
    let count = 0

    // Apply kernel centered at i
    for (let k = -halfKernel; k <= halfKernel; k++) {
      const idx = i + k
      if (idx >= 0 && idx < length) {
        sum += profile[idx]
        count++
      }
    }

    smoothed[i] = sum / count
  }

  return smoothed
}

/**
 * Find the index of the minimum value in a range.
 *
 * @param arr - Array to search
 * @param start - Start index (inclusive)
 * @param end - End index (inclusive)
 * @returns Index of minimum value
 */
function findMinimumIndex(arr: Float32Array, start: number, end: number): number {
  let minIdx = start
  let minVal = arr[start]

  for (let i = start + 1; i <= end; i++) {
    if (arr[i] < minVal) {
      minVal = arr[i]
      minIdx = i
    }
  }

  return minIdx
}
