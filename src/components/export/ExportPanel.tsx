import { useState, useCallback } from 'react'
import { usePipelineStore } from '../../store'
import { generateAsepriteJson, bundleExportZip } from '../../pipeline/export'
import type { ExportProgress } from '../../types/export'
import './ExportPanel.css'

export function ExportPanel() {
  const { sourceImage, frames, animations, exportConfig } = usePipelineStore()
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ fileName: string; url: string } | null>(null)

  const handleExport = useCallback(async () => {
    if (!sourceImage || frames.length === 0) {
      return
    }

    setIsExporting(true)
    setExportResult(null)

    try {
      const onProgress = (p: ExportProgress) => {
        setProgress(p)
      }

      const asepriteJson = generateAsepriteJson({
        spriteSheetSize: { width: sourceImage.width, height: sourceImage.height },
        frames,
        animations,
      })

      const outputFileName = 'spritesheet'
      const blob = await bundleExportZip({
        sourceImage,
        frames,
        asepriteJson,
        outputFileName,
        onProgress,
      })

      const url = URL.createObjectURL(blob)
      setExportResult({ fileName: `${outputFileName}.zip`, url })
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [sourceImage, frames, animations])

  const handleDownload = useCallback(() => {
    if (!exportResult) return

    const a = document.createElement('a')
    a.href = exportResult.url
    a.download = exportResult.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [exportResult])

  const progressPercentage = progress
    ? Math.round((progress.currentFrame / progress.totalFrames) * 100)
    : 0

  return (
    <div className="export-panel">
      <div className="export-panel__header">
        <h2>Export</h2>
      </div>

      <div className="export-panel__content">
        <div className="export-panel__stats">
          <div className="export-panel__stat">
            <span className="export-panel__stat-label">Frames:</span>
            <span className="export-panel__stat-value">{frames.length}</span>
          </div>
          <div className="export-panel__stat">
            <span className="export-panel__stat-label">Animations:</span>
            <span className="export-panel__stat-value">{animations.length}</span>
          </div>
          <div className="export-panel__stat">
            <span className="export-panel__stat-label">Format:</span>
            <span className="export-panel__stat-value">{exportConfig.format}</span>
          </div>
        </div>

        {isExporting && progress && (
          <div className="export-panel__progress">
            <div className="export-panel__progress-header">
              <span className="export-panel__progress-stage">{progress.stage}</span>
              <span className="export-panel__progress-text">
                {progress.currentFrame} / {progress.totalFrames} frames
              </span>
            </div>
            <div className="export-panel__progress-bar">
              <div
                className="export-panel__progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {exportResult && (
          <div className="export-panel__result">
            <p className="export-panel__result-text">Export complete!</p>
            <button
              className="export-panel__download-btn"
              onClick={handleDownload}
              type="button"
            >
              Download {exportResult.fileName}
            </button>
          </div>
        )}

        <div className="export-panel__actions">
          <button
            className="export-panel__export-btn"
            onClick={handleExport}
            disabled={isExporting || !sourceImage || frames.length === 0}
            type="button"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
