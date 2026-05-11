import { useState } from 'react'
import { usePipelineStore } from '../../store'
import { generateSpritesheet } from './api'
import { ImageDropzone } from '../../components/common/ImageDropzone'
import './GeneratePanel.css'

const SIZE_OPTIONS = [
  { label: '256x256', width: 256, height: 256 },
  { label: '512x512', width: 512, height: 512 },
  { label: '1024x1024', width: 1024, height: 1024 },
]

const STYLE_OPTIONS = [
  'pixel-art',
  '16-bit',
  '32-bit',
  'hand-drawn',
  'vector-flat',
  'isometric',
]

export const GeneratePanel: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [selectedSize, setSelectedSize] = useState(SIZE_OPTIONS[1])
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const setSourceImage = usePipelineStore((state) => state.setSourceImage)
  const markStageComplete = usePipelineStore((state) => state.markStageComplete)

  const handleGenerate = async () => {
    setError(null)
    setValidationError(null)

    if (!prompt.trim()) {
      setValidationError('Please enter a prompt')
      return
    }

    setIsGenerating(true)

    try {
      const imageBlob = await generateSpritesheet(prompt, {
        width: selectedSize.width,
        height: selectedSize.height,
        style: selectedStyle,
        format: 'png',
      })

      const imageBitmap = await createImageBitmap(imageBlob)
      const canvas = document.createElement('canvas')
      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      ctx.drawImage(imageBitmap, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      setSourceImage({
        imageData,
        width: canvas.width,
        height: canvas.height,
        fileName: `generated-${Date.now()}.png`,
      })

      markStageComplete('generate', true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageLoad = async (imageData: ImageData, fileName: string) => {
    setSourceImage({
      imageData,
      width: imageData.width,
      height: imageData.height,
      fileName,
    })

    markStageComplete('generate', true)
  }

  return (
    <div className="generate-panel">
      <div className="generate-section">
        <h3>Import Spritesheet</h3>
        <p className="section-description">Upload an existing spritesheet to begin processing</p>
        <ImageDropzone onImageLoad={handleImageLoad} />
      </div>

      <div className="generate-divider">OR</div>

      <div className="generate-section">
        <h3>Generate Spritesheet</h3>
        <p className="section-description">Create a spritesheet using AI generation</p>

        <div className="form-group">
          <label htmlFor="prompt-input">Prompt</label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the spritesheet you want to generate..."
            rows={4}
            disabled={isGenerating}
          />
          {validationError && <div className="validation-error">{validationError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="size-select">Size</label>
          <select
            id="size-select"
            value={`${selectedSize.width}x${selectedSize.height}`}
            onChange={(e) => {
              const size = SIZE_OPTIONS.find(
                (s) => `${s.width}x${s.height}` === e.target.value
              )
              if (size) setSelectedSize(size)
            }}
            disabled={isGenerating}
          >
            {SIZE_OPTIONS.map((size) => (
              <option key={`${size.width}x${size.height}`} value={`${size.width}x${size.height}`}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="style-select">Style</label>
          <select
            id="style-select"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            disabled={isGenerating}
          >
            {STYLE_OPTIONS.map((style) => (
              <option key={style} value={style}>
                {style.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  )
}
