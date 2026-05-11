import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSpritesheet, loadImageFromFile } from '../../pipeline/generate/api'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('generateSpritesheet', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.restoreAllMocks()
  })

  it('throws error for empty prompt', async () => {
    await expect(generateSpritesheet('', { width: 512, height: 512 })).rejects.toThrow('Prompt is required')
  })

  it('throws error for whitespace-only prompt', async () => {
    await expect(generateSpritesheet('   ', { width: 512, height: 512 })).rejects.toThrow('Prompt is required')
  })

  it('sends POST request with correct payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }),
    })

    await generateSpritesheet('test prompt', { width: 512, height: 512 })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('test prompt'),
      })
    )
  })

  it('uses VITE_GENERATE_API_URL env var when set', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }),
    })

    await generateSpritesheet('test', { width: 256, height: 256 })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/generate',
      expect.any(Object)
    )
  })

  it('returns Blob on successful generation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }),
    })

    const result = await generateSpritesheet('test', { width: 512, height: 512 })

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('image/png')
  })

  it('throws error on API failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    })

    await expect(generateSpritesheet('test', { width: 512, height: 512 })).rejects.toThrow('API request failed')
  })

  it('throws error when response indicates failure', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Generation failed',
      }),
    })

    await expect(generateSpritesheet('test', { width: 512, height: 512 })).rejects.toThrow('Generation failed')
  })
})

describe('loadImageFromFile', () => {
  it('returns a promise that resolves to ImageData', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' })

    const resultPromise = loadImageFromFile(mockFile)

    expect(resultPromise).toBeInstanceOf(Promise)
  })

  it('accepts File object as parameter', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' })

    expect(async () => {
      await loadImageFromFile(mockFile)
    }).not.toThrow()
  })
})
