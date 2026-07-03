const API_BASE_URL = '/api/v1'

interface TokenData {
  accessToken: string
  refreshToken: string
}

function getStoredTokens(): TokenData | null {
  const access = localStorage.getItem('access_token')
  const refresh = localStorage.getItem('refresh_token')
  if (access && refresh) {
    return { accessToken: access, refreshToken: refresh }
  }
  return null
}

function storeTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const tokens = getStoredTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { ...headers, ...((options?.headers as Record<string, string>) || {}) },
    ...options,
  })

  if (response.status === 401 && tokens?.refreshToken && !endpoint.includes('/auth/')) {
    // Try to refresh token
    const refreshed = await refreshAccessToken(tokens.refreshToken)
    if (refreshed) {
      // Retry original request with new token
      const newTokens = getStoredTokens()
      headers['Authorization'] = `Bearer ${newTokens?.accessToken}`
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { ...headers, ...((options?.headers as Record<string, string>) || {}) },
        ...options,
      })
      if (!retryResponse.ok) {
        const retryError = await retryResponse.json().catch(() => ({ message: 'An error occurred' }))
        throw new Error(retryError.message || `HTTP ${retryResponse.status}`)
      }
      return retryResponse.json()
    }
    // Refresh failed, clear tokens
    clearTokens()
    throw new Error('Session expired')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

async function refreshAccessToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return false

    const data = await response.json()
    storeTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}

// Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: string
    name: string
    surname: string
    email: string
    role: string
    gender: string
    avatar: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
}

export interface UserInfo {
  id: string
  name: string
  surname: string
  email: string
  role: string
  gender: string
  avatar: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// API methods
export const api = {
  // Auth
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  me: () => request<UserInfo>('/auth/me'),

  // Utility functions
  storeTokens,
  clearTokens,
  getStoredTokens,
}

export function getAuthHeaders(): Record<string, string> {
  const tokens = getStoredTokens()
  if (tokens?.accessToken) {
    return { Authorization: `Bearer ${tokens.accessToken}` }
  }
  return {}
}