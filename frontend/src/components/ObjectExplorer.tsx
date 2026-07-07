import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HardDrive, FolderOpen, File, Upload, ChevronRight, Home } from 'lucide-react'
import type { S3Object } from '@/services/buckets'
import { bucketsApi, formatBytes, formatDate } from '@/services/buckets'

interface ObjectExplorerProps {
  bucketName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin: boolean
  onObjectClick: (key: string) => void
}

export default function ObjectExplorer({
  bucketName,
  open,
  onOpenChange,
  isAdmin,
  onObjectClick,
}: ObjectExplorerProps) {
  const [objects, setObjects] = useState<S3Object[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefix, setPrefix] = useState('')
  const [breadcrumb, setBreadcrumb] = useState<string[]>([])

  const loadObjects = async (currentPrefix: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await bucketsApi.listObjects(bucketName, currentPrefix || undefined)

      if (data.Contents) {
        setObjects(data.Contents)
        console.log(objects)
      } else {setObjects([])}
      
      if(data.CommonPrefixes && data.CommonPrefixes.length > 0) {

        let f:string[] = []
        data.CommonPrefixes.forEach((prefix) => {
          f.push(prefix.Prefix)
        })

        setFolders(f)
      } else { setFolders([])}

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objects')

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setPrefix('')
      setObjects([])
      setFolders([])
      setBreadcrumb([])
      loadObjects(prefix)
    }
    
  }, [open, bucketName])

  const handleFolderClick = (folderPrefix: string) => {
    setPrefix(folderPrefix)
    setBreadcrumb(folderPrefix.split("/"))
    loadObjects(folderPrefix)
  }

  const handleBreadcrumbClick = async (index: number) => {
    setLoading(true)
    if (index === -1) {
      setPrefix('')
      setObjects([])
      setFolders([])
      setBreadcrumb([])
      loadObjects(prefix).
        then()

    } else {
      const newPrefix = breadcrumb.slice(0, index +1).join().replaceAll(",", "/").concat("/")
      setPrefix(newPrefix)
      setBreadcrumb(breadcrumb.slice(0, index + 1))
      setObjects([])
      setFolders([])
      await loadObjects(prefix)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true} >
      <DialogContent className="sm:max-w-7xl max-h-[80vh] h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {bucketName}
          </DialogTitle>
          <DialogDescription>
            Navegue pelos objetos e pastas do bucket
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBreadcrumbClick(-1)}
            className="h-8 px-2"
          >
            <Home className="h-4 w-4" />
          </Button>
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBreadcrumbClick(index)}
                className="h-8 px-2"
              >
                {item}
              </Button>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => loadObjects(prefix)} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : objects.length === 0 && folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Não há nada aqui!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Folders
              {objects.length <= 0 ? (

                folders.map((folder) => (
                  
                  <div
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer"
                  >
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                  
                    <span className="flex-1 truncate">{
                        folder.split("/").reverse()[1]
                      }
                    </span>
                    
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))

              ) : (

                objects.map((file) => (
                  <div
                    key={file.Key}
                    onClick={() => onObjectClick(file.Key)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer"
                  >
                    <File className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{file.Key.split('/').pop()}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.Size)} • {formatDate(file.LastModified)}
                      </p>
                    </div>
                  </div>
                ))
                
              )} */}

                {folders.map((folder) => (
                  
                  <div
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer"
                  >
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                  
                    <span className="flex-1 truncate">{
                        folder.split("/").reverse()[1]
                      }
                    </span>
                    
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}

                {objects.map((file) => (
                  <div
                    key={file.Key}
                    onClick={() => onObjectClick(file.Key)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer"
                  >
                    <File className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{file.Key.split('/').pop()}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.Size)} • {formatDate(file.LastModified)}
                      </p>
                    </div>
                  </div>
                ))
                
                }


              {/* Files */}
              {/* {files.map((file) => (
                <div
                  key={file.Key}
                  onClick={() => onObjectClick(file.Key)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer"
                >
                  <File className="h-5 w-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{file.Key.split('/').pop()}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.Size)} • {formatDate(file.LastModified)}
                    </p>
                  </div>
                </div>
              ))} */}
            </div>
          )}
        </div>

        {/* Upload Button (Admin only) */}
        {isAdmin && (
          <div className="border-t pt-4">
            <Button className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload de Arquivo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}