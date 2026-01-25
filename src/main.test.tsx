import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ===== MOCKI =====

// mock App
vi.mock('./App', () => ({
  default: () => <div data-testid="app">App</div>,
}))

// mock AuthProvider
vi.mock('./context/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}))

// mock ReactDOM
const renderMock = vi.fn()

vi.mock('react-dom/client', () => ({
  createRoot: () => ({
    render: renderMock,
  }),
}))

// ===== TEST =====

describe('main.tsx', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`
    renderMock.mockClear()
  })

  it('renders application without crashing', async () => {
    await import('./main')

    expect(renderMock).toHaveBeenCalledTimes(1)
  })
})
