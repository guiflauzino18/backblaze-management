import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HardDrive, MoreVertical, FolderOpen, Trash2, FileText } from 'lucide-react'
import type { Bucket } from '@/services/buckets'
import { formatBytes } from '@/services/buckets'

interface BucketCardProps {
  bucket: Bucket
  objectCount: number
  totalSize: number
  onEnter: () => void
  onDelete: () => void
  isAdmin: boolean
}

export default function BucketCard({ bucket, objectCount, totalSize, onEnter, onDelete, isAdmin }: BucketCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEnter}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <HardDrive className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">{bucket.Name}</CardTitle>
            </div>
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEnter() }}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Entrar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Tem certeza que deseja deletar o bucket "${bucket.Name}"?`)) {
                      onDelete()
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{objectCount} {objectCount === 1 ? 'objeto' : 'objetos'}</span>
          </div>
          <div className="font-medium">{formatBytes(totalSize)}</div>
        </div>
      </CardContent>
    </Card>
  )
}