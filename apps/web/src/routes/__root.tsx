import { HeadContent, Scripts, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import appCss from '../styles.css?url'

type Session = {
  user: {
    id: string
    email: string
    name: string
    role: string
    isActive: boolean
  }
} | null

export interface RouterContext {
  session: Session
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'SiteMap' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
  shellComponent: RootShell,
})

function RootComponent() {
  return <Outlet />
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
