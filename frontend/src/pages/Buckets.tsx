import { useState } from 'react'
import BucketGrid from '@/components/BucketGrid'
import ObjectExplorer from '@/components/ObjectExplorer'
import ObjectVersionModal from '@/components/ObjectVersionModal'
import LifecycleModal from '@/components/LifecycleModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { bucketsApi, type CreateBucketRequest } from '@/services/buckets'

export default function Buckets() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [bucketName, setBucketName] = useState('')
  const [region, setRegion] = useState('us-east-005')
  const [creating, setCreating] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [lifecycleBucket, setLifecycleBucket] = useState<string | null>(null)

  const handleCreateBucket = async () => {
    if (!bucketName.trim()) {
      window.alert('Nome do bucket é obrigatório')
      return
    }

    try {
      setCreating(true)
      const data: CreateBucketRequest = {
        name: bucketName.trim(),
        region: region,
      }
      await bucketsApi.createBucket(data)
      window.alert(`Bucket "${bucketName}" criado com sucesso!`)
      setShowCreateDialog(false)
      setBucketName('')
      setRegion('us-west-002')
      // BucketGrid will automatically refresh
    } catch (err) {
      window.alert(`Erro ao criar bucket: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleEnterBucket = (bucketName: string) => {
    setSelectedBucket(bucketName)
  }

  const handleDeleteBucket = (bucketName: string) => {
    window.alert(`Bucket "${bucketName}" foi deletado com sucesso.`)
  }

  const handleObjectClick = (objectKey: string) => {
    setSelectedObject(objectKey)
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-heading font-bold">Buckets</h2>
        <p className="text-muted-foreground">
          Gerencie seus buckets e objetos no Backblaze B2
        </p>
      </div>

      {/* Buckets Grid */}
      <BucketGrid
        isAdmin={isAdmin}
        onCreateBucket={() => setShowCreateDialog(true)}
        onEnterBucket={handleEnterBucket}
        onDeleteBucket={handleDeleteBucket}
        onLifecycleBucket={(name) => setLifecycleBucket(name)}
      />

      {/* Object Explorer Modal */}
      {selectedBucket && (
        <ObjectExplorer
          bucketName={selectedBucket}
          open={!!selectedBucket}
          onOpenChange={(open) => !open && setSelectedBucket(null)}
          isAdmin={isAdmin}
          onObjectClick={handleObjectClick}
        />
      )}

      {/* Object Version Modal */}
      {selectedBucket && selectedObject && (
        <ObjectVersionModal
          bucketName={selectedBucket}
          objectKey={selectedObject}
          open={!!selectedObject}
          onOpenChange={(open) => !open && setSelectedObject(null)}
          isAdmin={isAdmin}
        />
      )}

      {/* Lifecycle Modal */}
      {lifecycleBucket && (
        <LifecycleModal
          bucketName={lifecycleBucket}
          open={!!lifecycleBucket}
          onOpenChange={(open) => !open && setLifecycleBucket(null)}
        />
      )}

      {/* Create Bucket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Bucket</DialogTitle>
            <DialogDescription>
              Crie um novo bucket para armazenar seus objetos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bucket-name">Nome do Bucket</Label>
              <Input
                id="bucket-name"
                placeholder="meu-bucket"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Região</Label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={creating}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {/* <option value="us-west-002">US West 002</option> */}
                {/* <option value="us-west-001">US West 001</option> */}
                <option value="us-east-005">US East 005</option>
                {/* <option value="eu-central-003">EU Central 003</option> */}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateBucket} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Bucket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}