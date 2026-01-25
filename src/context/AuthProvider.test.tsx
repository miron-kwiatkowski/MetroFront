import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React, { useContext } from 'react'
import { AuthProvider } from './AuthProvider'
import { AuthContext } from './AuthContext'

// ===== KOMPONENT TESTOWY =====
const TestConsumer = () => {
  const { user, token, login, logout } = useContext(AuthContext)

  return (
    <div>
      <span data-testid="user">{user ?? 'null'}</span>
      <span data-testid="token">{token ?? 'null'}</span>

      <button onClick={() => login('test-token', 'Jan')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes state from localStorage', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', 'Adam')

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(await screen.findByTestId('user')).toHaveTextContent('Adam')
    expect(await screen.findByTestId('token')).toHaveTextContent('stored-token')
  })

  it('login sets user and token and saves to localStorage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login'))

    expect(screen.getByTestId('user')).toHaveTextContent('Jan')
    expect(screen.getByTestId('token')).toHaveTextContent('test-token')

    expect(localStorage.getItem('user')).toBe('Jan')
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  it('logout clears user and token and removes from localStorage', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', 'Adam')

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('token')).toHaveTextContent('null')

    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
