import { apiRequest } from './client'
import { clearAuthStorage, persistSession } from '../common/auth/tokenStorage'

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login/', {
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

export async function fetchMe() {
  return apiRequest('/api/auth/me/')
}

export async function logout() {
  // JWTs are stateless on the backend, so logging out just drops the local session
  clearAuthStorage()
}
