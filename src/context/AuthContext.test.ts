import { describe, it, expect } from 'vitest'
import { AuthContext } from './AuthContext'

describe('AuthContext', () => {
  it('has correct default values', () => {
    const value = AuthContext._currentValue

    expect(value.user).toBeNull()
    expect(value.token).toBeNull()
    expect(typeof value.login).toBe('function')
    expect(typeof value.logout).toBe('function')
  })
})
