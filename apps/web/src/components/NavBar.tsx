import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MapPin, Menu, X } from 'lucide-react'
import { ThemeToggle } from '#/components/theme-toggle'
import { Button } from '#/components/ui/button'

const publicNavItems = [
  { to: '/about', label: 'About' },
] as const

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          SiteMap
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {publicNavItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg px-2.5 h-7 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-lg px-2.5 h-7 text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Sign up
            </Link>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 sm:hidden">
          <nav className="flex flex-col gap-2 pt-3">
            {publicNavItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {label}
              </Link>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg px-2.5 h-7 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg px-2.5 h-7 text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
