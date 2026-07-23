import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  BarChart3,
  Users,
  HardDrive,
  FileText,
  LogOut,
  Menu,
  ChevronLeft,
} from 'lucide-react'
import Header from './Header'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Buckets', href: '/buckets', icon: HardDrive },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: FileText },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNavigate = (href: string) => {
    navigate(href)
    setSidebarOpen(false)
  }

  const isActive = (href: string) => location.pathname === href

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <h1 className="text-lg font-heading font-bold">B2 Management</h1>
            <p className="text-xs text-muted-foreground">Cloud Storage</p>
          </div>
        )}
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavigate(item.href)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title={collapsed && !mobile ? item.name : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {(!collapsed || mobile) && <span>{item.name}</span>}
          </button>
        ))}
      </nav>

      <Separator />

      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>
              {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name} {user?.surname}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          )}
          {(!collapsed || mobile) && (
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-background flex-col">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger className="fixed left-4 top-4 z-40 lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <Header user={user}/>

      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-full flex-col border-r bg-card transition-all duration-200 lg:flex ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
        >
          <ChevronLeft className={`h-3 w-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-200 flex-1 lg:${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Mobile header */}
        {/* <header className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-sm font-heading font-bold">B2 Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header> */}

        <main className=''>{children}</main>
      </div>

      <footer className='border-t text-center p-3 text-sm mt-30'>
        <span>
          v1.3.4 {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  )
}