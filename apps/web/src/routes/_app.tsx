import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { NavSidebar } from '#/components/NavSidebar'

const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getRequest } = await import('@tanstack/react-start/server')
  const { auth } = await import('#/lib/auth')
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  return session
})

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const session = await getSessionFn()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    const user = session.user as typeof session.user & { isActive?: boolean; role?: string }
    if (user.isActive === false) {
      throw redirect({ to: '/login' })
    }
    return { session }
  },
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <NavSidebar session={session} />
      {/* Offset for sidebar on desktop, top bar on mobile */}
      <main className="flex-1 pt-14 lg:pt-0 lg:pl-60">
        <Outlet />
      </main>
    </div>
  )
}
