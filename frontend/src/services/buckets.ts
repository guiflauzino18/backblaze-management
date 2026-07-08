export interface Bucket {
  Name: string
  CreationDate: string
}

export interface S3Object {
  Key: string
  Size: number
  LastModified: string
  Etag: string
}

export interface S3Result{
    "CommonPrefixes": [
        {
            "Prefix": string
        }
    ],
    "Contents": S3Object[] | null,
    "ContinuationToken": null,
    "Delimiter": string,
    "KeyCount": number,
    "MaxKeys": number,
    "Name": string,
    "Prefix": string,
    "RequestCharged": string,
}

export interface ObjectVersion {
  VersionId: string
  Key: string
  Size: number
  LastModified: string
  IsLatest: boolean
}

export interface StorageMetrics {
  bucket_name: string
  total_size: number
  object_count: number
}

export interface CreateBucketRequest {
  name: string
  region: string
}

const API_BASE_URL = '/api/v1'

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

function getStoredTokens(): { accessToken: string } | null {
  const access = localStorage.getItem('access_token')
  if (access) {
    return { accessToken: access }
  }
  return null
}

export const bucketsApi = {
  // Buckets
  listBuckets: () => request<Bucket[]>('/buckets'),

  createBucket: (data: CreateBucketRequest) =>
    request<{ message: string }>('/buckets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteBucket: (name: string) =>
    request<{ message: string }>(`/buckets/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  // Objects
  listObjects: (bucketName: string, prefix?: string, showDeleted?: boolean) => {
    let query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '?'
    if (showDeleted) {
      query += `${prefix ? '&' : ''}show_deleted=true`
    }
    if (!query || query === '?') {
      query = ''
    }
    return request<S3Result>(`/buckets/${encodeURIComponent(bucketName)}/objects${query}`)
  },

  listObjectVersions: (bucketName: string, key: string) =>
    request<ObjectVersion[]>(`/buckets/${encodeURIComponent(bucketName)}/objects/versions?key=${encodeURIComponent(key)}`),

  uploadFile: (bucketName: string, key: string, file: File) => {
    const formData = new FormData()
    formData.append('key', key)
    formData.append('file', file)

    const tokens = getStoredTokens()
    const headers: Record<string, string> = {}
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`
    }

    return fetch(`${API_BASE_URL}/buckets/${encodeURIComponent(bucketName)}/objects/upload`, {
      method: 'POST',
      headers,
      body: formData,
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((error) => {
          throw new Error(error.message || `HTTP ${response.status}`)
        })
      }
      return response.json()
    })
  },

  downloadFile: async (bucketName: string, key: string, versionId?: string) => {
    const tokens = getStoredTokens()
    const headers: Record<string, string> = {}
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`
    }

    let url = `${API_BASE_URL}/buckets/${encodeURIComponent(bucketName)}/objects/download?key=${encodeURIComponent(key)}`
    if (versionId) {
      url += `&version_id=${encodeURIComponent(versionId)}`
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.blob()
  },

  deleteObject: (bucketName: string, key: string) =>
    request<{ message: string }>(`/buckets/${encodeURIComponent(bucketName)}/objects?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),

  // Lifecycle
  getLifecycle: (bucketName: string) =>
    request<any>(`/buckets/${encodeURIComponent(bucketName)}/lifecycle`),

  updateLifecycle: (bucketName: string, rules: any[]) =>
    request<{ message: string }>(`/buckets/${encodeURIComponent(bucketName)}/lifecycle`, {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    }),

  deleteLifecycle: (bucketName: string) =>
    request<{ message: string }>(`/buckets/${encodeURIComponent(bucketName)}/lifecycle`, {
      method: 'DELETE',
    }),

  // Storage Metrics
  getStorageMetrics: (bucketName: string) =>
    request<StorageMetrics>(`/buckets/${encodeURIComponent(bucketName)}/storage`),
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}