import { apiRequest } from './client'
import { clearAuthStorage, persistSession } from '../common/auth/tokenStorage'

export async function login({ email, password }) {
  const data = await apiRequest('/api/portal/auth/login/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  })
  persistSession({
    access: data.access,
    refresh: data.refresh,
    user: data.user,
  })
  return data
}

export async function register({ email, password, first_name, last_name, phone }) {
  const data = await apiRequest('/api/portal/auth/register/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password, first_name, last_name, phone }),
  })
  persistSession({
    access: data.access,
    refresh: data.refresh,
    user: data.user,
  })
  return data
}

export async function fetchMe() {
  return apiRequest('/api/portal/auth/me/')
}

export async function logout() {
  const refresh = localStorage.getItem('portal_refresh_token')
  try {
    if (refresh) {
      await apiRequest('/api/portal/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      })
    }
  } catch {
    // Always clear local session even if blacklist call fails
  } finally {
    clearAuthStorage()
  }
}
