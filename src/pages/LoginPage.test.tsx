import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from './LoginPage'

// Mock LoginForm
vi.mock('../components/LoginForm', () => ({
  default: () => <div data-testid="login-form">LoginForm</div>,
}))

describe('LoginPage', () => {
  it('renders LoginForm', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })
})
