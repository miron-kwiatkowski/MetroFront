import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, register } from './auth'

// ===== MOCK ENV =====
vi.stubEnv('VITE_API_URL', 'http://localhost:3000')

// ===== MOCK FETCH =====
global.fetch = vi.fn()

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls login endpoint with correct payload', async () => {
    const mockResponse = { token: 'fake-jwt' }

    ;(fetch as unknown as vi.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    })

    const data = {
      email: 'test@test.com',
      password: '123456',
    }

    const result = await login(data)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    expect(result).toEqual(mockResponse)
  })

  it('calls register endpoint with correct payload', async () => {
    const mockResponse = { success: true }

    ;(fetch as unknown as vi.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    })

    const data = {
      name: 'Jan',
      email: 'jan@test.com',
      password: 'password',
    }

    const result = await register(data)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    expect(result).toEqual(mockResponse)
  })
})
