import { useState, useEffect } from 'react'
import BucketCard from '@/components/BucketCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Loader2, RefreshCcwIcon, RefreshCw } from 'lucide-react'
import type { Bucket, BucketAnalytics } from '@/services/buckets'
import { bucketsApi } from '@/services/buckets'

interface BucketGridProps {
  isAdmin: boolean
  onCreateBucket: () => void
  onEnterBucket: (bucketName: string) => void
  onDeleteBucket: (bucketName: string) => void
  onLifecycleBucket: (bucketName: string) => void
}

export default function BucketGrid({ isAdmin, onCreateBucket, onEnterBucket, onDeleteBucket, onLifecycleBucket }: BucketGridProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [analytics, setAnalytics] = useState<Map<string, BucketAnalytics>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadBuckets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await bucketsApi.listBuckets()
      setBuckets(data)

      // Load analytics for all buckets
      try {
        const analyticsData = await bucketsApi.listAnalytics()
        const analyticsMap = new Map<string, BucketAnalytics>()
        analyticsData.forEach((a) => {
          analyticsMap.set(a.bucket_name, a)
        })
        setAnalytics(analyticsMap)
      } catch (err) {
        console.error('Failed to load analytics:', err)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buckets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBuckets()
  }, [])

  const handleDelete = async (bucketName: string) => {
    try {
      await bucketsApi.deleteBucket(bucketName)
      await loadBuckets()
      onDeleteBucket(bucketName)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete bucket')
    }
  }

  const filteredBuckets = buckets.filter((bucket) =>
    bucket.Name.includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadBuckets}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar buckets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            className="pl-9"
          />
        </div>
        <div className='flex gap-3 items-center'>

          <Button onClick={loadBuckets}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {isAdmin && (
            <Button onClick={onCreateBucket}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Bucket
            </Button>
          )}
        </div>
      </div>

      {/* Buckets Grid */}
      {filteredBuckets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Nenhum bucket encontrado' : 'Nenhum bucket disponível'}
          </p>
          {isAdmin && !searchTerm && (
            <Button onClick={onCreateBucket} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro bucket
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBuckets.map((bucket) => {
            const bucketAnalytics = analytics.get(bucket.Name)
            return (
              <BucketCard
                key={bucket.Name}
                bucket={bucket}
                objectCount={bucketAnalytics?.object_count || 0}
                totalSize={bucketAnalytics?.storage_size || 0}
                onEnter={() => onEnterBucket(bucket.Name)}
                onDelete={() => handleDelete(bucket.Name)}
                onLifecycle={() => onLifecycleBucket(bucket.Name)}
                isAdmin={isAdmin}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}