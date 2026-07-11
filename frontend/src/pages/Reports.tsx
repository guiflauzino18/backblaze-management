import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { executionsApi, type ExecutionLog, type ExecutionLogFilter } from '@/services/executions'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function Reports() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null)
  const [buckets, setBuckets] = useState<string[]>([])
  const [filterBucket, setFilterBucket] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const limit = 20

  const loadBuckets = useCallback(async () => {
    try {
      const data = await executionsApi.listBuckets()
      setBuckets(data)
    } catch {
      // Silently fail - buckets filter will just be empty
    }
  }, [])

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filter: ExecutionLogFilter = {
        page,
        limit,
      }

      if (filterBucket) {
        filter.bucket_name = filterBucket
      }

      if (filterStatus === 'success') {
        filter.exit_code = 0
      } else if (filterStatus === 'error') {
        filter.exit_code = 1
      }

      const response = await executionsApi.listLogs(filter)
      setLogs(response.data)
      setTotal(response.total)
      setTotalPages(response.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [page, filterBucket, filterStatus])

  useEffect(() => {
    loadBuckets()
  }, [loadBuckets])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const getStatusBadge = (exitCode: number) => {
    if (exitCode === 0) {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Sucesso
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Erro
      </Badge>
    )
  }

  const isNumericSearch = searchTerm.length > 0 && !isNaN(Number(searchTerm))
  const searchExitCode = isNumericSearch ? parseInt(searchTerm) : null

  const displayedLogs = logs.filter((log) => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()

    // Search by bucket name
    if (log.bucket_name.toLowerCase().includes(term)) return true

    // Search by exit code
    if (searchExitCode !== null && log.exit_code === searchExitCode) return true

    // Search in log content (only show if term is at least 3 chars to avoid performance issues)
    if (term.length >= 3 && log.log_content.toLowerCase().includes(term)) return true

    return false
  })

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive text-lg font-medium">Acesso restrito</p>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <main>
        <div className="mb-8 border-b">
          <h2 className="text-2xl font-heading font-bold">Relatórios</h2>
          <p className="text-muted-foreground">
            Logs de execução dos endpoints de envio de arquivos para a Backblaze
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por bucket, código ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filterBucket || undefined} onValueChange={(v: string | null) => { setFilterBucket(v === 'all' ? '' : (v ?? '')); setPage(1) }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os buckets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os buckets</SelectItem>
              {buckets.map((bucket) => (
                <SelectItem key={bucket} value={bucket}>{bucket}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus || undefined} onValueChange={(v: string | null) => { setFilterStatus(v === 'all' ? '' : (v ?? '')); setPage(1) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sucesso</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {logs.filter((l) => l.exit_code === 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Erros</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {logs.filter((l) => l.exit_code !== 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={loadLogs}>Tentar novamente</Button>
              </div>
            ) : displayedLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum log de execução encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Bucket</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Data</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedLogs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 text-sm font-medium">{log.bucket_name}</td>
                          <td className="py-3">{getStatusBadge(log.exit_code)}</td>
                          <td className="py-3 text-sm text-muted-foreground">{formatDate(log.executed_at)}</td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando página {page} de {totalPages} ({total} registros)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Log Details */}
                {selectedLog && (
                  <div className="mt-4 p-4 rounded-lg bg-muted border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">
                        Log do bucket {selectedLog.bucket_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedLog.exit_code)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(selectedLog.executed_at)}
                        </span>
                      </div>
                    </div>
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap font-mono">
                      {selectedLog.log_content || '(vazio)'}
                    </pre>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}