import { useCallback, useState } from 'react'
import './ImageDropzone.css'

interface ImageDropzoneProps {
  onImageLoad: (imageData: ImageData, fileName: string) => void
  disabled?: boolean
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageLoad,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      if (!file.type.match(/^image\/(png|jpeg|jpg)/)) {
        setError('Please upload a PNG or JPEG image')
        return
      }

      try {
        const img = new Image()
        const reader = new FileReader()

        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              setError('Failed to process image')
              return
            }

            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, img.width, img.height)
            onImageLoad(imageData, file.name)
          }

          img.onerror = () => setError('Failed to load image')

          img.src = e.target?.result as string
        }

        reader.readAsDataURL(file)
      } catch {
        setError('Failed to process file')
      }
    },
    [onImageLoad]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [disabled, handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  return (
    <div
      className={`image-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileInput}
        disabled={disabled}
        className="dropzone-input"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="dropzone-label">
        <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="dropzone-text">
          {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
        </span>
        <span className="dropzone-hint">PNG or JPEG</span>
      </label>
      {error && <div className="dropzone-error">{error}</div>}
    </div>
  )
}
