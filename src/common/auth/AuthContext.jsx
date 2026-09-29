import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../../api/auth'
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setStoredUser,
} from './tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [bootstrapping, setBootstrapping] = useState(() => Boolean(getAccessToken()))

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      if (!getAccessToken()) {
        setBootstrapping(false)
        return
      }
      try {
        const me = await authApi.fetchMe()
        if (!cancelled) {
          setUser(me)
          setStoredUser(me)
        }
      } catch {
        if (!cancelled) {
          clearAuthStorage()
          setUser(null)
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }
    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isStaff: user?.role === 'staff',
      bootstrapping,
      login,
      register,
      logout,
    }),
    [user, bootstrapping, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
