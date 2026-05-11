export interface GenerationOptions {
  width: number
  height: number
  style?: string
  format?: 'png' | 'jpeg'
}

export interface GenerationRequest {
  prompt: string
  options: GenerationOptions
}

export interface GenerationResponse {
  success: boolean
  image?: string
  error?: string
}

const API_BASE_URL = import.meta.env.VITE_GENERATE_API_URL || '/api/generate'

export async function generateSpritesheet(
  prompt: string,
  options: GenerationOptions
): Promise<Blob> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required')
  }

  const request: GenerationRequest = {
    prompt: prompt.trim(),
    options,
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  const data: GenerationResponse = await response.json()

  if (!data.success || !data.image) {
    throw new Error(data.error || 'Generation failed')
  }

  const base64Data = data.image.split(',')[1]
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return new Blob([bytes], { type: 'image/png' })
}

export async function loadImageFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        resolve(imageData)
      }

      img.onerror = () => reject(new Error('Failed to load image'))

      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.readAsDataURL(file)
  })
}
