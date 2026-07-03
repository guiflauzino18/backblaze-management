import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HardDrive,
  FolderOpen,
  FileText,
  Activity,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Total de Buckets',
      value: '12',
      description: 'Buckets ativos',
      icon: FolderOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Arquivos',
      value: '1,234',
      description: 'Total de objetos',
      icon: FileText,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Espaço Utilizado',
      value: '45.2 GB',
      description: 'de 100 GB disponíveis',
      icon: HardDrive,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      title: 'Requisições (hoje)',
      value: '2,847',
      description: 'últimas 24h',
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ]

  const recentActivity = [
    { action: 'Upload', file: 'backup-db-2026-07-03.sql', bucket: 'backups', time: '2 min atrás' },
    { action: 'Download', file: 'logo.png', bucket: 'assets', time: '15 min atrás' },
    { action: 'Delete', file: 'temp-file.txt', bucket: 'temp', time: '1 hora atrás' },
    { action: 'Upload', file: 'report-julho.pdf', bucket: 'documents', time: '3 horas atrás' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* <Header user={user}/> */}
      
      {/* Main Content */}
      <main className=''>
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo ao B2 Management, {user?.name}! Aqui está um resumo do seu storage.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
              <CardDescription>Últimas ações nos buckets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        activity.action === 'Upload' ? 'bg-emerald-100 text-emerald-600' :
                        activity.action === 'Download' ? 'bg-blue-100 text-blue-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {activity.action === 'Upload' ? '↑' : activity.action === 'Download' ? '↓' : '✕'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.file}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.action} • {activity.bucket}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uso do Storage</CardTitle>
              <CardDescription>Distribuição por bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'backups', usage: 40, color: 'bg-blue-500' },
                  { name: 'assets', usage: 25, color: 'bg-emerald-500' },
                  { name: 'documents', usage: 20, color: 'bg-amber-500' },
                  { name: 'temp', usage: 10, color: 'bg-purple-500' },
                  { name: 'others', usage: 5, color: 'bg-gray-500' },
                ].map((bucket) => (
                  <div key={bucket.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{bucket.name}</span>
                      <span className="text-muted-foreground">{bucket.usage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${bucket.color}`}
                        style={{ width: `${bucket.usage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}