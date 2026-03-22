import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, FolderOpen, MapPin, Map, Info, Users, LogOut, Menu, X } from 'lucide-react'
import { ThemeToggle } from '#/components/theme-toggle'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/maps', label: 'Maps', icon: Map },
  { to: '/updates', label: 'Updates', icon: MapPin },
  { to: '/about', label: 'About', icon: Info },
] as const

interface NavSidebarProps {
  session: {
    user: {
      id: string
      email: string
      name: string
      role?: string
      isActive?: boolean
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

export function NavSidebar({ session }: NavSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = session?.user.role === 'admin'

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/login'
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg" onClick={() => setOpen(false)}>
          <MapPin className="h-5 w-5 text-primary" />
          SiteMap
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === '/admin'
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-3">
          <p className="text-sm font-medium truncate">{session?.user.name || session?.user.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{session?.user.role}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          SiteMap
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - always visible on desktop, slide-in drawer on mobile/tablet */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
