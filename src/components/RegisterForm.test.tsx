import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RegisterForm from './RegisterForm'

// ===== MOCK ENV =====
vi.stubEnv('VITE_API_URL', 'http://localhost:3000')

// ===== MOCK API =====
vi.mock('../api/api', () => ({
  register: vi.fn(),
}))

import { register } from '../api/api'

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls register API and shows success message from backend', async () => {
    ;(register as vi.Mock).mockResolvedValueOnce({
      message: 'Utworzono konto',
    })

    render(<RegisterForm />)

    fireEvent.change(screen.getByPlaceholderText('Imię'), {
      target: { value: 'Jan' },
    })

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'jan@test.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Hasło'), {
      target: { value: '123456' },
    })

    fireEvent.click(screen.getByText('Zarejestruj się'))

    expect(
      await screen.findByText('Utworzono konto')
    ).toBeInTheDocument()

    expect(register).toHaveBeenCalledWith({
      name: 'Jan',
      email: 'jan@test.com',
      password: '123456',
    })
  })

  it('shows default success message when backend does not return message', async () => {
    ;(register as vi.Mock).mockResolvedValueOnce({})

    render(<RegisterForm />)

    fireEvent.change(screen.getByPlaceholderText('Imię'), {
      target: { value: 'Anna' },
    })

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'anna@test.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Hasło'), {
      target: { value: 'password' },
    })

    fireEvent.click(screen.getByText('Zarejestruj się'))

    expect(
      await screen.findByText('Zarejestrowano!')
    ).toBeInTheDocument()
  })

  it('redirects to Facebook login on button click', () => {
    delete (window as any).location
    ;(window as any).location = { href: '' }

    render(<RegisterForm />)

    fireEvent.click(screen.getByText('Zaloguj przez Facebook'))

    expect(window.location.href).toBe(
      'http://localhost:3000/auth/facebook/redirect'
    )
  })
})
