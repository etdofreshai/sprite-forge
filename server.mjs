import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const PORT = parseInt(process.env.PORT || '80', 10)

const CODEX_AUTH_PATH = process.env.CODEX_AUTH_PATH || '/home/node/.codex/auth.json'

function getSizeString(width, height) {
  const validSizes = ['1024x1024', '1536x1024', '1024x1536']
  const requested = `${width}x${height}`
  if (validSizes.includes(requested)) return requested
  return '1024x1024'
}

async function getAccessToken() {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY
  }

  try {
    const authData = JSON.parse(fs.readFileSync(CODEX_AUTH_PATH, 'utf-8'))
    if (authData.OPENAI_API_KEY) {
      return authData.OPENAI_API_KEY
    }
    if (authData.tokens?.access_token) {
      return authData.tokens.access_token
    }
  } catch {
    // auth file not found or unreadable
  }

  return null
}

async function handleGenerate(req, res) {
  const { prompt, options } = req.body

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt is required' })
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return res.status(401).json({ success: false, error: 'No OpenAI API key configured. Set OPENAI_API_KEY or mount Codex auth.' })
  }

  const openai = new OpenAI({ apiKey: accessToken })

  const size = getSizeString(options?.width || 512, options?.height || 512)
  const styleHint = options?.style ? `, ${options.style} style` : ''
  const fullPrompt = `${prompt.trim()}${styleHint}. Transparent background.`

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-2',
      prompt: fullPrompt,
      size,
      n: 1,
      response_format: 'b64_json',
    })

    const b64 = response.data[0].b64_json
    return res.json({ success: true, image: `data:image/png;base64,${b64}` })
  } catch (err) {
    const message = err.status === 401
      ? 'Authentication failed — token may be expired. Run codex login to refresh.'
      : err.message || 'Image generation failed'
    return res.status(err.status || 500).json({ success: false, error: message })
  }
}

async function startServer() {
  const app = express()
  app.use(express.json())

  app.post('/api/generate', handleGenerate)

  if (isProduction) {
    const distPath = path.join(__dirname, 'dist')
    app.use(express.static(distPath))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.listen(PORT, () => {
    console.log(`Sprite Forge server listening on port ${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
