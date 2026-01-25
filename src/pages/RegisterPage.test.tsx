import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RegisterPage from './RegisterPage'

// Mock RegisterForm
vi.mock('../components/RegisterForm', () => ({
  default: () => <div data-testid="register-form">RegisterForm</div>,
}))

describe('RegisterPage', () => {
  it('renders RegisterForm', () => {
    render(<RegisterPage />)
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
  })
})
