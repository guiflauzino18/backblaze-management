import { useState, useEffect } from 'react'
import BucketCard from '@/components/BucketCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Loader2 } from 'lucide-react'
import type { Bucket, StorageMetrics } from '@/services/buckets'
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
  const [metrics, setMetrics] = useState<Map<string, StorageMetrics>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadBuckets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await bucketsApi.listBuckets()
      setBuckets(data)

      // Load metrics for each bucket
      const metricsMap = new Map<string, StorageMetrics>()
      // Promise.all(
      //   data.map(async (bucket) => {
      //     try {
      //       console.log(bucket)
      //       const metric = await bucketsApi.getStorageMetrics(bucket.Name.toLowerCase())
      //       metricsMap.set(bucket.Name, metric)
      //     } catch (err) {
      //       console.error(`Failed to load metrics for bucket ${bucket.Name}:`, err)
      //     }
      //   })
      // )
      setMetrics(metricsMap)
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

  // const filteredBuckets = buckets.filter((bucket) =>
  //   // bucket.Name.includes(searchTerm.toLowerCase())
  // )
  const filteredBuckets = buckets

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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Button onClick={onCreateBucket}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Bucket
          </Button>
        )}
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
            const bucketMetrics = metrics.get(bucket.Name)
            return (
              <BucketCard
                key={bucket.Name}
                bucket={bucket}
                objectCount={bucketMetrics?.object_count || 0}
                totalSize={bucketMetrics?.total_size || 0}
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