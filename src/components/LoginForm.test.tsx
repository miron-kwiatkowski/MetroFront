import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from './LoginForm'
import { AuthContext } from '../context/AuthContext'

// ===== MOCK ENV =====
vi.stubEnv('VITE_API_URL', 'http://localhost:3000')

// ===== MOCK API =====
vi.mock('../api/api', () => ({
  login: vi.fn(),
}))

import { login as apiLogin } from '../api/api'

// ===== MOCK CONTEXT =====
const loginMock = vi.fn()

const renderWithContext = () =>
  render(
    <AuthContext.Provider value={{ login: loginMock }}>
      <LoginForm />
    </AuthContext.Provider>
  )

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in successfully and shows success message', async () => {
    ;(apiLogin as vi.Mock).mockResolvedValueOnce({
      token: 'fake-token',
      user: { id: 1, email: 'test@test.com' },
    })

    renderWithContext()

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@test.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Hasło'), {
      target: { value: '123456' },
    })

    fireEvent.click(screen.getByText('Zaloguj się'))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith(
        'fake-token',
        { id: 1, email: 'test@test.com' }
      )
    })

    expect(
      screen.getByText('Zalogowano pomyślnie!')
    ).toBeInTheDocument()
  })

  it('shows error message when credentials are invalid', async () => {
    ;(apiLogin as vi.Mock).mockResolvedValueOnce({
      message: 'Nieprawidłowe dane',
    })

    renderWithContext()

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'wrong@test.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Hasło'), {
      target: { value: 'wrong' },
    })

    fireEvent.click(screen.getByText('Zaloguj się'))

    expect(
      await screen.findByText('Nieprawidłowe dane')
    ).toBeInTheDocument()

    expect(loginMock).not.toHaveBeenCalled()
  })

  it('shows server error message when request fails', async () => {
    ;(apiLogin as vi.Mock).mockRejectedValueOnce(new Error('Network error'))

    renderWithContext()

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@test.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Hasło'), {
      target: { value: '123456' },
    })

    fireEvent.click(screen.getByText('Zaloguj się'))

    expect(
      await screen.findByText('Błąd połączenia z serwerem')
    ).toBeInTheDocument()
  })

  it('redirects to Facebook login on button click', () => {
    delete (window as any).location
    ;(window as any).location = { href: '' }

    renderWithContext()

    fireEvent.click(screen.getByText('Zaloguj przez Facebook'))

    expect(window.location.href).toBe(
      'http://localhost:3000/auth/facebook/redirect'
    )
  })
})
