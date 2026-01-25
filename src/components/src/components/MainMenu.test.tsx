import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MainMenu from './MainMenu'
import { AuthContext } from '../context/AuthContext'

// ===== HELPER DO RENDEROWANIA =====
const renderWithContext = (contextValue: any) =>
  render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('MainMenu', () => {
  it('shows login and register links when user is not logged in', () => {
    renderWithContext({
      user: null,
      logout: vi.fn(),
    })

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Logowanie')).toBeInTheDocument()
    expect(screen.getByText('Rejestracja')).toBeInTheDocument()

    expect(screen.queryByText('Wyloguj')).not.toBeInTheDocument()
    expect(screen.queryByText(/Witaj,/)).not.toBeInTheDocument()
  })

  it('shows user info and logout button when user is logged in', () => {
    const logoutMock = vi.fn()

    renderWithContext({
      user: 'Jan',
      logout: logoutMock,
    })

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Witaj, Jan')).toBeInTheDocument()
    expect(screen.getByText('Profil')).toBeInTheDocument()
    expect(screen.getByText('Wyloguj')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Wyloguj'))
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })
})
