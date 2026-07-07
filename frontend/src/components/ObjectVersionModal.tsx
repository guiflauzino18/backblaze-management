import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HardDrive, File, Download, Trash2, CheckCircle2 } from 'lucide-react'
import type { ObjectVersion } from '@/services/buckets'
import { bucketsApi, formatBytes, formatDate } from '@/services/buckets'

interface ObjectVersionModalProps {
  bucketName: string
  objectKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin: boolean
}

export default function ObjectVersionModal({
  bucketName,
  objectKey,
  open,
  onOpenChange,
  isAdmin,
}: ObjectVersionModalProps) {
  const [versions, setVersions] = useState<ObjectVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadVersions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await bucketsApi.listObjectVersions(bucketName, objectKey)
      setVersions(data)
      console.log(data[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && objectKey) {
      loadVersions()
    }
  }, [open, objectKey, bucketName])

  const handleDownload = async (versionId?: string) => {
    try {
      const blob = await bucketsApi.downloadFile(bucketName, objectKey)
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = objectKey.split('/').pop() || 'download'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      window.alert(`Erro ao fazer download: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    }
  }

  const handleDelete = async (versionId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta versão?')) {
      return
    }

    try {
      setDeleting(versionId)
      await bucketsApi.deleteObject(bucketName, objectKey)
      window.alert('Versão deletada com sucesso!')
      await loadVersions()
    } catch (err) {
      window.alert(`Erro ao deletar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setDeleting(null)
    }
  }

  const getFileName = (key: string): string => {
    return key.split('/').pop() || key
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            {getFileName(objectKey)}
          </DialogTitle>
          <DialogDescription>
            Versões do objeto • {bucketName}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadVersions} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhuma versão encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Current Version */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Versão Atual</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(versions[0]?.Size || 0)} • {formatDate(versions[0]?.LastModified || '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload()}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(versions[0]?.VersionId || '')}
                        disabled={deleting === versions[0]?.VersionId}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Previous Versions */}
              {versions.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground px-1">
                    Versões Anteriores
                  </p>
                  {versions.slice(1).map((version) => (
                    <div
                      key={version.VersionId}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {/* {version.VersionId} */}
                            {version.Key} - {formatDate(version.LastModified)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(version.Size)} • {formatDate(version.LastModified)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(version.VersionId)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(version.VersionId)}
                            disabled={deleting === version.VersionId}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}