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

// First login step: { next: 'password' } or { next: 'link_sent' } (a set-password link was emailed)
export async function checkLoginEmail(email) {
  return apiRequest('/api/auth/login/email/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email }),
  })
}

export async function forgotPassword(email) {
  return apiRequest('/api/auth/password/forgot/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email }),
  })
}

// Validates an emailed link's token: { purpose: 'set' | 'reset', email }
export async function checkPasswordLink(token) {
  return apiRequest('/api/auth/password/check/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ token }),
  })
}

export async function setPasswordFromLink({ token, password }) {
  return apiRequest('/api/auth/password/set/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ token, password }),
  })
}

export async function fetchMe() {
  return apiRequest('/api/auth/me/')
}

export async function logout() {
  // JWTs are stateless on the backend, so logging out just drops the local session
  clearAuthStorage()
}
