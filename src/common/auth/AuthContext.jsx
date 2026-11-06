import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../../api/auth'
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setStoredUser,
} from './tokenStorage'

const AuthContext = createContext(null)

// Internal team members use the admin portal; borrowers and brokers use the client portal
export function isStaffUser(user) {
  return Boolean(user?.role) && user.role !== 'borrower' && user.role !== 'broker'
}

export function isBrokerUser(user) {
  return user?.role === 'broker'
}

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
      isStaff: isStaffUser(user),
      isBroker: isBrokerUser(user),
      bootstrapping,
      login,
      logout,
    }),
    [user, bootstrapping, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
