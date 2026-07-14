export interface ExecutionLog {
  id: string
  bucket_name: string
  exit_code: number
  log_content: string
  endpoint_user_id: string | null
  executed_at: string
  created_at: string
}

export interface ExecutionLogListResponse {
  data: ExecutionLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ExecutionLogFilter {
  bucket_name?: string
  exit_code?: number
  page?: number
  limit?: number
}

const API_BASE_URL = '/api/v1'

function getStoredTokens(): { accessToken: string } | null {
  const access = localStorage.getItem('access_token')
  if (access) {
    return { accessToken: access }
  }
  return null
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
    ...options,
    headers: { ...headers, ...((options?.headers as Record<string, string>) || {}) },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const executionsApi = {
  listLogs: (filter?: ExecutionLogFilter) => {
    const params = new URLSearchParams()
    if (filter?.bucket_name) params.set('bucket_name', filter.bucket_name)
    if (filter?.exit_code !== undefined) params.set('exit_code', String(filter.exit_code))
    if (filter?.page) params.set('page', String(filter.page))
    if (filter?.limit) params.set('limit', String(filter.limit))

    const query = params.toString()
    return request<ExecutionLogListResponse>(`/executions/logs${query ? `?${query}` : ''}`)
  },

  listBuckets: () => {
    return request<string[]>('/executions/buckets')
  },
}