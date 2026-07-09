import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HardDrive,
  FolderOpen,
  FileText,
  Loader2,
} from 'lucide-react'
import type { BucketAnalytics } from '@/services/buckets'
import { bucketsApi, formatBytes } from '@/services/buckets'

export default function Dashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<BucketAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await bucketsApi.listAnalytics()
        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  const totalBuckets = analytics.length
  const totalObjects = analytics.reduce((sum, a) => sum + a.object_count, 0)
  const totalStorage = analytics.reduce((sum, a) => sum + a.storage_size, 0)

  const maxStorage = Math.max(...analytics.map(a => a.storage_size), 1)

  const stats = [
    {
      title: 'Total de Buckets',
      value: totalBuckets.toString(),
      description: 'Buckets ativos',
      icon: FolderOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Arquivos',
      value: totalObjects.toLocaleString('pt-BR'),
      description: 'Total de objetos',
      icon: FileText,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Espaço Utilizado',
      value: formatBytes(totalStorage),
      description: 'Armazenamento total',
      icon: HardDrive,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ]

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Main Content */}
      <main className=''>
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo ao B2 Management, {user?.name}! Aqui está um resumo do seu storage.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Storage Usage by Bucket */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uso do Storage por Bucket</CardTitle>
              <CardDescription>Distribuição de armazenamento</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-4">
                  {analytics.map((a) => {
                    const percentage = maxStorage > 0 ? (a.storage_size / maxStorage) * 100 : 0
                    return (
                      <div key={a.bucket_name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{a.bucket_name}</span>
                          <span className="text-muted-foreground">{formatBytes(a.storage_size)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.object_count} {a.object_count === 1 ? 'objeto' : 'objetos'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bucket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes dos Buckets</CardTitle>
              <CardDescription>Informações coletadas pelo analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-4">
                  {analytics.map((a) => (
                    <div key={a.bucket_name} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <HardDrive className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.bucket_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(a.storage_size)} • {a.object_count} {a.object_count === 1 ? 'objeto' : 'objetos'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
