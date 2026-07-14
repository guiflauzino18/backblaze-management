import type { UserInfo } from './api'

export type { UserInfo } from './api'

export interface CreateUserRequest {
  name: string
  surname: string
  email: string
  password: string
  role: string
  gender: string
}

export interface UpdateUserRequest {
  name?: string
  surname?: string
  email?: string
  role?: string
  gender?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const tokens = (() => {
    const access = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    if (access && refresh) return { accessToken: access, refreshToken: refresh }
    return null
  })()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }

  const response = await fetch(`/api/v1${endpoint}`, {
    headers: { ...headers, ...((options?.headers as Record<string, string>) || {}) },
    ...options,
  })

  if (response.status === 401 && tokens?.refreshToken && !endpoint.includes('/auth/')) {
    // Try refresh
    const refreshRes = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    })

    if (refreshRes.ok) {
      const data = await refreshRes.json()
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      headers['Authorization'] = `Bearer ${data.access_token}`

      const retryResponse = await fetch(`/api/v1${endpoint}`, {
        headers: { ...headers, ...((options?.headers as Record<string, string>) || {}) },
        ...options,
      })

      if (!retryResponse.ok) {
        const retryError = await retryResponse.json().catch(() => ({ message: 'An error occurred' }))
        throw new Error(retryError.message || `HTTP ${retryResponse.status}`)
      }
      return retryResponse.json()
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    throw new Error('Session expired')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const usersService = {
  list: (search = '', page = 1, limit = 10) =>
    request<PaginatedResponse<UserInfo>>(`/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`),

  getById: (id: string) =>
    request<UserInfo>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    request<UserInfo>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateUserRequest) =>
    request<UserInfo>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  toggleActive: (id: string) =>
    request<UserInfo>(`/users/${id}/toggle-active`, {
      method: 'PATCH',
    }),

  generateToken: (id: string) =>
    request<{ token: string }>(`/users/${id}/generate-token`, {
      method: 'POST',
    }),
}
