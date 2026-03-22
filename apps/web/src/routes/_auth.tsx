import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { NavBar } from '#/components/NavBar'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="flex min-h-screen items-center justify-center p-4 pt-14">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
