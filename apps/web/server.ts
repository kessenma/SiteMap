import path from 'node:path'
import fs from 'node:fs'

const PORT = Number(process.env.PORT ?? 3000)
const DIST_DIR = path.resolve(import.meta.dir, 'dist')
const CLIENT_DIR = path.join(DIST_DIR, 'client')
const SERVER_ENTRY = path.join(DIST_DIR, 'server', 'server.js')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
}

async function start() {
  const serverModule = (await import(SERVER_ENTRY)) as {
    default: { fetch: (req: Request) => Response | Promise<Response> }
  }
  const handler = serverModule.default

  Bun.serve({
    port: PORT,
    hostname: '0.0.0.0',
    async fetch(req) {
      const url = new URL(req.url)

      // Handle file proxy (serves images from object storage)
      if (url.pathname === '/api/files' && req.method === 'GET') {
        const { handleFileProxy } = await import('./src/server/file-proxy')
        return handleFileProxy(req)
      }

      // Handle file uploads
      if (url.pathname === '/api/upload' && req.method === 'POST') {
        const { handleUpload } = await import('./src/server/upload-handler')
        return handleUpload(req)
      }

      // Handle Better Auth routes
      if (url.pathname.startsWith('/api/auth/')) {
        // Mobile-specific endpoints
        if (url.pathname === '/api/auth/mobile-token' && req.method === 'POST') {
          const { handleMobileToken } = await import('./src/server/mobile-auth')
          return handleMobileToken(req)
        }
        if (url.pathname === '/api/auth/refresh-token' && req.method === 'POST') {
          const { handleRefreshToken } = await import('./src/server/mobile-auth')
          return handleRefreshToken(req)
        }
        // WebAuthn passkey routes
        if (url.pathname.startsWith('/api/auth/webauthn/') && req.method === 'POST') {
          const { handleWebAuthnRequest } = await import('./src/server/webauthn')
          const webauthnResponse = await handleWebAuthnRequest(req)
          if (webauthnResponse) return webauthnResponse
        }
        // All other auth routes handled by Better Auth
        const { handleAuthRequest } = await import('./src/server/auth-handler')
        return handleAuthRequest(req)
      }

      // Try serving static files from client dist
      if (url.pathname !== '/' && !url.pathname.startsWith('/_server')) {
        const filePath = path.join(CLIENT_DIR, url.pathname)
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath)
          const headers: Record<string, string> = {}
          if (MIME_TYPES[ext]) headers['Content-Type'] = MIME_TYPES[ext]
          if (url.pathname.startsWith('/assets/')) {
            headers['Cache-Control'] = 'public, max-age=31536000, immutable'
          } else {
            headers['Cache-Control'] = 'public, max-age=3600'
          }
          return new Response(Bun.file(filePath), { headers })
        }
      }

      // Fall through to TanStack Start SSR handler
      const response = await handler.fetch(req)
      return response
    },
  })

  console.log(`Server listening on http://localhost:${PORT}`)
}

start()
