import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../common/auth/tokenStorage'

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

let refreshPromise = null

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    clearAuthStorage()
    throw new Error('No refresh token')
  }

  const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) {
    clearAuthStorage()
    throw new Error('Session expired')
  }

  const data = await res.json()
  // Rotation: always store new refresh when returned
  setTokens({
    access: data.access,
    refresh: data.refresh || refresh,
  })
  return data.access
}

function enqueueRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * Authenticated API helper. Auto-rotates refresh on 401 once.
 */
export async function apiRequest(path, options = {}) {
  const { skipAuth = false, headers: customHeaders, ...rest } = options
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  if (!skipAuth) {
    const access = getAccessToken()
    if (access) headers.Authorization = `Bearer ${access}`
  }

  let res = await fetch(`${API_URL}${path}`, { ...rest, headers })

  if (!skipAuth && res.status === 401 && getRefreshToken()) {
    try {
      const newAccess = await enqueueRefresh()
      headers.Authorization = `Bearer ${newAccess}`
      res = await fetch(`${API_URL}${path}`, { ...rest, headers })
    } catch {
      clearAuthStorage()
      throw new Error('Session expired')
    }
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.email?.[0] ||
      data?.password?.[0] ||
      data?.non_field_errors?.[0] ||
      'Request failed'
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message))
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export { API_URL }
