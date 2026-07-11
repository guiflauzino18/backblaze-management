import { MoreVertical, Pencil, Ban, Trash2, UserCheck, Key } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { UserInfo } from '@/services/api'

interface UserCardProps {
  user: UserInfo
  onEdit: (user: UserInfo) => void
  onToggleActive: (user: UserInfo) => void
  onDelete: (user: UserInfo) => void
  onGenerateToken?: (user: UserInfo) => void
}

export default function UserCard({ user, onEdit, onToggleActive, onDelete, onGenerateToken }: UserCardProps) {
  const getInitials = () => {
    return `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
  }

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary'
  }

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'Admin'
    if (role === 'endpoint') return 'Endpoint'
    return 'Usuário'
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-sm font-medium">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">
                {user.name} {user.surname}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {getRoleLabel(user.role)}
                </Badge>
                {!user.is_active ? (
                   <Badge variant="destructive" className="text-xs">
                    Desativado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Ativo
                  </Badge>
                )
                }
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(user)}>
                {user.is_active ? (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Desabilitar
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              {user.role === 'endpoint' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onGenerateToken?.(user)}>
                    <Key className="mr-2 h-4 w-4" />
                    Gerar Token de API
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}