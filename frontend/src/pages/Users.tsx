import { useState, useEffect } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import UserCard from '@/components/UserCard'
import UserFormDialog from '@/components/UserFormDialog'
import { usersService, type UserInfo } from '@/services/users'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/contexts/ToastContext'

export default function Users() {
  const { success, error: showError } = useToast()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserInfo | null>(null)
  const [toggleUser, setToggleUser] = useState<UserInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await usersService.list(search, page, 10)
      setUsers(response.data)
      setTotal(response.total)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar usuários'
      showError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const handleEdit = (user: UserInfo) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setIsSubmitting(true)
    try {
      await usersService.delete(deleteUser.id)
      setDeleteUser(null)
      loadUsers()
      success('Usuário excluído com sucesso!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir usuário'
      showError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async () => {
    if (!toggleUser) return
    setIsSubmitting(true)
    try {
      await usersService.toggleActive(toggleUser.id)
      setToggleUser(null)
      loadUsers()
      success(toggleUser.is_active ? 'Usuário desabilitado com sucesso!' : 'Usuário ativado com sucesso!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar usuário'
      showError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSuccess = () => {
    loadUsers()
    success('Usuário salvo com sucesso!')
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Header */}
      <div className="mb-8 border-b">
        <h2 className="text-2xl font-heading font-bold">Usuários</h2>
        <p className="text-muted-foreground">
          Gerencie os usuários do sistema
        </p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, sobrenome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="mb-6 p-4 bg-destructive/10 border-destructive">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 border p-3 rounded-lg bg-card">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onToggleActive={(u) => setToggleUser(u)}
              onDelete={(u) => setDeleteUser(u)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * 10 + 1} a {Math.min(page * 10, total)} de {total} usuários
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {deleteUser?.name} {deleteUser?.surname}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} variant="destructive" size="default">
              {isSubmitting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Confirmation */}
      <AlertDialog open={!!toggleUser} onOpenChange={(open) => !open && setToggleUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleUser?.is_active ? 'Desabilitar' : 'Ativar'} usuário
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {toggleUser?.is_active ? 'desabilitar' : 'ativar'} o usuário{' '}
              {toggleUser?.name} {toggleUser?.surname}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive} disabled={isSubmitting} size="default">
              {isSubmitting ? 'Salvando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}