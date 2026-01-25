import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// ===== MOCKI KOMPONENTÓW =====

vi.mock('./components/MainMenu', () => ({
  default: () => <nav data-testid="main-menu">MainMenu</nav>,
}))

vi.mock('./pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}))

vi.mock('./pages/RegisterPage', () => ({
  default: () => <div>Register Page</div>,
}))

// ===== TESTY =====

describe('App routing', () => {
  it('renders LoginPage on /login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.getByTestId('main-menu')).toBeInTheDocument()
  })

  it('renders RegisterPage on /register route', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Register Page')).toBeInTheDocument()
    expect(screen.getByTestId('main-menu')).toBeInTheDocument()
  })
})
