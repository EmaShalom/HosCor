import { useState, useCallback } from 'react'
import client from '../api/client'

export interface AuthUser {
  username: string
  role: string
  unit?: string | null
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('hoscor_token')
  )
  const [user, setUser] = useState<AuthUser | null>(() => {
    const u = localStorage.getItem('hoscor_user')
    return u ? JSON.parse(u) : null
  })

  const login = useCallback(async (username: string, password: string) => {
    const res = await client.post('/auth/login', { username, password })
    const { token: t, username: u, role: r, unit: unit } = res.data.data
    const authUser: AuthUser = { username: u, role: r, unit: unit ?? null }
    localStorage.setItem('hoscor_token', t)
    localStorage.setItem('hoscor_user', JSON.stringify(authUser))
    setToken(t)
    setUser(authUser)
    return authUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hoscor_token')
    localStorage.removeItem('hoscor_user')
    setToken(null)
    setUser(null)
  }, [])

  return { token, user, login, logout }
}
