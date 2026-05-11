import { useState, useCallback } from 'react'
import { usePipelineStore } from '../../store'
import { detectAllFrames, DEFAULT_SPLIT_CONFIG } from '../../pipeline/split'
import type { SplitConfig, DetectedFrame } from '../../pipeline/split'
import { SplitPreview } from './SplitPreview'
import { FrameGrid } from './FrameGrid'
import './SplitPanel.css'

export function SplitPanel() {
  const { sourceImage, setFrames, markStageComplete } = usePipelineStore()

  const [config, setConfig] = useState<SplitConfig>(DEFAULT_SPLIT_CONFIG)
  const [detectedFrames, setDetectedFrames] = useState<DetectedFrame[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null)

  const handleConfigChange = useCallback((key: keyof SplitConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleRunDetection = useCallback(async () => {
    if (!sourceImage) return

    setIsProcessing(true)
    try {
      const alpha = extractAlphaChannel(sourceImage.imageData)
      const result = detectAllFrames(alpha, sourceImage.width, sourceImage.height, config)
      setDetectedFrames(result.frames)
    } catch (error) {
      console.error('Detection failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [sourceImage, config])

  const handleAcceptFrames = useCallback(() => {
    if (detectedFrames.length === 0 || !sourceImage) return

    const frames = detectedFrames.map((detected, index) => {
      const width = detected.x1 - detected.x0 + 1
      const height = detected.y1 - detected.y0 + 1

      const imageData = new ImageData(width, height)
      const sourceData = sourceImage.imageData.data
      const destData = imageData.data

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = detected.x0 + x
          const srcY = detected.y0 + y
          const srcIdx = (srcY * sourceImage.width + srcX) * 4
          const destIdx = (y * width + x) * 4

          destData[destIdx] = sourceData[srcIdx]
          destData[destIdx + 1] = sourceData[srcIdx + 1]
          destData[destIdx + 2] = sourceData[srcIdx + 2]
          destData[destIdx + 3] = sourceData[srcIdx + 3]
        }
      }

      return {
        id: `frame-${Date.now()}-${index}`,
        region: {
          rect: {
            x: detected.x0,
            y: detected.y0,
            width,
            height,
          },
          sourceIndex: 0,
        },
        durationMs: 100,
      }
    })

    setFrames(frames)
    markStageComplete('split', true)
  }, [detectedFrames, sourceImage, setFrames, markStageComplete])

  const handleRemoveFrame = useCallback((index: number) => {
    setDetectedFrames((prev) => prev.filter((_, i) => i !== index))
    setSelectedFrameIndex((prev) => prev === index ? null : prev && prev > index ? prev - 1 : prev)
  }, [])

  return (
    <div className="split-panel">
      <div className="split-panel__header">
        <h2>Split Sprite Sheet</h2>
        <div className="split-panel__stats">
          {sourceImage && (
            <span>
              {sourceImage.width}×{sourceImage.height}px
            </span>
          )}
          {detectedFrames.length > 0 && (
            <span>{detectedFrames.length} frames detected</span>
          )}
        </div>
      </div>

      <div className="split-panel__config">
        <h3>Detection Settings</h3>

        <div className="split-panel__setting">
          <label htmlFor="min-row-gap">
            Min Row Gap: {config.minRowGap}px
            <span className="split-panel__setting-desc">
              Minimum gap between rows to keep them separate
            </span>
          </label>
          <input
            id="min-row-gap"
            type="range"
            min="0"
            max="20"
            value={config.minRowGap}
            onChange={(e) => handleConfigChange('minRowGap', parseInt(e.target.value))}
            disabled={isProcessing}
          />
        </div>

        <div className="split-panel__setting">
          <label htmlFor="min-depth-ratio">
            Valley Depth: {(config.minDepthRatio * 100).toFixed(0)}%
            <span className="split-panel__setting-desc">
              Lower = more splits, Higher = fewer splits
            </span>
          </label>
          <input
            id="min-depth-ratio"
            type="range"
            min="0.05"
            max="0.5"
            step="0.01"
            value={config.minDepthRatio}
            onChange={(e) => handleConfigChange('minDepthRatio', parseFloat(e.target.value))}
            disabled={isProcessing}
          />
        </div>

        <div className="split-panel__setting">
          <label htmlFor="alpha-threshold">
            Alpha Threshold: {config.alphaThreshold}
            <span className="split-panel__setting-desc">
              Pixels with alpha above this are considered content
            </span>
          </label>
          <input
            id="alpha-threshold"
            type="range"
            min="0"
            max="255"
            value={config.alphaThreshold}
            onChange={(e) => handleConfigChange('alphaThreshold', parseInt(e.target.value))}
            disabled={isProcessing}
          />
        </div>

        <div className="split-panel__setting">
          <label htmlFor="min-pixels">
            Min Pixels: {config.minPixels}
            <span className="split-panel__setting-desc">
              Minimum opaque pixels for a valid sprite
            </span>
          </label>
          <input
            id="min-pixels"
            type="range"
            min="1"
            max="200"
            value={config.minPixels}
            onChange={(e) => handleConfigChange('minPixels', parseInt(e.target.value))}
            disabled={isProcessing}
          />
        </div>

        <div className="split-panel__setting">
          <label htmlFor="padding">
            Padding: {config.padding}px
            <span className="split-panel__setting-desc">
              Extra space around each detected sprite
            </span>
          </label>
          <input
            id="padding"
            type="range"
            min="0"
            max="10"
            value={config.padding}
            onChange={(e) => handleConfigChange('padding', parseInt(e.target.value))}
            disabled={isProcessing}
          />
        </div>

        <div className="split-panel__actions">
          <button
            className="split-panel__detect-btn"
            onClick={handleRunDetection}
            disabled={!sourceImage || isProcessing}
          >
            {isProcessing ? 'Detecting...' : 'Detect Frames'}
          </button>

          {detectedFrames.length > 0 && (
            <button
              className="split-panel__accept-btn"
              onClick={handleAcceptFrames}
            >
              Accept {detectedFrames.length} Frames
            </button>
          )}
        </div>
      </div>

      {sourceImage && (
        <div className="split-panel__preview">
          <SplitPreview
            sourceImage={sourceImage}
            detectedFrames={detectedFrames}
            selectedFrameIndex={selectedFrameIndex}
            onSelectFrame={setSelectedFrameIndex}
            onRemoveFrame={handleRemoveFrame}
          />
        </div>
      )}

      {detectedFrames.length > 0 && (
        <div className="split-panel__grid">
          <FrameGrid
            sourceImage={sourceImage}
            detectedFrames={detectedFrames}
            selectedFrameIndex={selectedFrameIndex}
            onSelectFrame={setSelectedFrameIndex}
          />
        </div>
      )}
    </div>
  )
}

function extractAlphaChannel(imageData: ImageData): Uint8Array {
  const alpha = new Uint8Array(imageData.width * imageData.height)
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = imageData.data[i * 4 + 3]
  }
  return alpha
}
