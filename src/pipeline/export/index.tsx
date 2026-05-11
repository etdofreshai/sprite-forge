import { useState, useCallback } from 'react'
import type { FC } from 'react'
import { usePipelineStore } from '../../store'
import { generateAsepriteJson } from './asepriteJson'
import { bundleExportZip } from './zipBundler'

export const ExportPanel: FC = () => {
  const sourceImage = usePipelineStore((s) => s.sourceImage)
  const frames = usePipelineStore((s) => s.frames)
  const animations = usePipelineStore((s) => s.animations)
  const [fileName, setFileName] = useState('spritesheet')
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalFrames = frames.length
  const totalAnimations = animations.length

  const handleExport = useCallback(async () => {
    if (!sourceImage || frames.length === 0) return
    setExporting(true)
    setError(null)
    setResultBlob(null)
    setProgress(0)

    try {
      const asepriteJson = generateAsepriteJson({
        spriteSheetSize: { width: sourceImage.width, height: sourceImage.height },
        frames,
        animations,
      })

      const blob = await bundleExportZip({
        sourceImage,
        frames,
        asepriteJson,
        outputFileName: fileName,
        onProgress: (p) => {
          const pct = p.totalFrames > 0 ? Math.round((p.currentFrame / p.totalFrames) * 100) : 0
          setProgress(pct)
        },
      })

      setResultBlob(blob)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }, [sourceImage, frames, animations, fileName])

  const handleDownload = useCallback(() => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [resultBlob, fileName])

  const canExport = sourceImage && totalFrames > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
      <h3 style={{ margin: 0 }}>Export</h3>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.85em', color: '#aaa' }}>Filename</span>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          disabled={exporting}
          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #444', background: '#1a1a2e', color: '#eee' }}
        />
      </label>

      <div style={{ background: '#1a1a2e', borderRadius: '6px', padding: '10px', fontSize: '0.85em', color: '#aaa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Animations:</span>
          <span style={{ color: '#eee' }}>{totalAnimations}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total frames:</span>
          <span style={{ color: '#eee' }}>{totalFrames}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Format:</span>
          <span style={{ color: '#eee' }}>Aseprite JSON + PNG</span>
        </div>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', fontSize: '0.85em', padding: '8px', background: '#2a1a1a', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {exporting && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ height: '8px', background: '#2a2a3e', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '0.8em', color: '#aaa', textAlign: 'center' }}>{progress}%</span>
        </div>
      )}

      {!resultBlob && (
        <button
          onClick={handleExport}
          disabled={!canExport || exporting}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            background: canExport && !exporting ? '#6366f1' : '#333',
            color: canExport && !exporting ? '#fff' : '#666',
            cursor: canExport && !exporting ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </button>
      )}

      {resultBlob && (
        <button
          onClick={handleDownload}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            background: '#22c55e',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Download {fileName}.zip ({(resultBlob.size / 1024).toFixed(1)} KB)
        </button>
      )}

      {resultBlob && (
        <button
          onClick={() => { setResultBlob(null); setProgress(0) }}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: 'transparent',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '0.85em',
          }}
        >
          Export again
        </button>
      )}

      {!canExport && (
        <p style={{ fontSize: '0.8em', color: '#666', margin: 0 }}>
          Import a spritesheet and split frames to enable export.
        </p>
      )}
    </div>
  )
}
