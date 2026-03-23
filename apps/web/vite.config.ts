import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { defineConfig, type Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Load root .env into process.env so server-side code (auth, DB) can access it
const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '../../.env') })

/**
 * Vite plugin that routes /api/* requests to their handlers.
 * In production, this is handled by server.ts instead.
 */
function apiMiddleware(): Plugin {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules') && !req.url.startsWith('/src/') && !req.url.includes('?v=')) {
          let logUrl = req.url
          if (logUrl.startsWith('/_serverFn/')) {
            try {
              const decoded = JSON.parse(atob(logUrl.slice('/_serverFn/'.length).replace(/-/g, '+').replace(/_/g, '/')))
              logUrl = `/_serverFn/${decoded.export?.split('_')[0] || decoded.export || logUrl}`
            } catch {}
          }
          console.log(`[${req.method}] ${logUrl}`);
        }
        // Handle file proxy (GET /api/files?path=...)
        if (req.url?.startsWith('/api/files') && req.method === 'GET') {
          const protocol = 'http'
          const host = req.headers.host || 'localhost:3000'
          const url = new URL(req.url, `${protocol}://${host}`)
          const headers = new Headers()
          for (const [key, val] of Object.entries(req.headers)) {
            if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
          }

          const request = new Request(url.toString(), { method: 'GET', headers })

          try {
            const { handleFileProxy } = await server.ssrLoadModule('./src/server/file-proxy.ts')
            const response = await handleFileProxy(request)
            res.statusCode = response.status
            response.headers.forEach((value: string, key: string) => {
              res.setHeader(key, value)
            })
            if (response.body) {
              const reader = (response.body as ReadableStream).getReader()
              const pump = async () => {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  res.write(value)
                }
                res.end()
              }
              pump().catch((err) => {
                console.error('File proxy stream error:', err)
                res.end()
              })
            } else {
              res.end(await response.text())
            }
          } catch (err) {
            console.error('File proxy middleware error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'File proxy failed' }))
          }
          return
        }

        // Handle file uploads
        if (req.url === '/api/upload' && req.method === 'POST') {
          const protocol = 'http'
          const host = req.headers.host || 'localhost:3000'
          const url = new URL(req.url, `${protocol}://${host}`)
          const headers = new Headers()
          for (const [key, val] of Object.entries(req.headers)) {
            if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
          }

          // Collect raw body for multipart parsing
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(Buffer.from(chunk))
          const body = Buffer.concat(chunks)

          const request = new Request(url.toString(), {
            method: 'POST',
            headers,
            body,
          })

          try {
            const { handleUpload } = await server.ssrLoadModule('./src/server/upload-handler.ts')
            const response = await handleUpload(request)
            res.statusCode = response.status
            response.headers.forEach((value: string, key: string) => {
              res.setHeader(key, value)
            })
            res.end(await response.text())
          } catch (err) {
            console.error('Upload middleware error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Upload failed' }))
          }
          return
        }

        // Handle PowerSync sync mutations (PUT/DELETE /api/sync/:table)
        if (req.url?.startsWith('/api/sync/') && (req.method === 'PUT' || req.method === 'DELETE')) {
          const protocol = 'http'
          const host = req.headers.host || 'localhost:3000'
          const url = new URL(req.url, `${protocol}://${host}`)
          const headers = new Headers()
          for (const [key, val] of Object.entries(req.headers)) {
            if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
          }

          const bodyStr = await new Promise<string>((resolve) => {
            let data = ''
            req.on('data', (chunk: Buffer) => { data += chunk.toString() })
            req.on('end', () => resolve(data))
          })

          const request = new Request(url.toString(), {
            method: req.method,
            headers,
            body: bodyStr,
          })

          try {
            const { handleSync } = await server.ssrLoadModule('./src/server/sync-handler.ts')
            const response = await handleSync(request)
            res.statusCode = response.status
            response.headers.forEach((value: string, key: string) => {
              res.setHeader(key, value)
            })
            res.end(await response.text())
          } catch (err) {
            console.error('Sync middleware error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Sync failed' }))
          }
          return
        }

        if (!req.url?.startsWith('/api/auth/')) return next()

        // Build a standard Request from Node IncomingMessage
        const protocol = 'http'
        const host = req.headers.host || 'localhost:3000'
        const url = new URL(req.url, `${protocol}://${host}`)
        const headers = new Headers()
        for (const [key, val] of Object.entries(req.headers)) {
          if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
        }

        const hasBody = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
        let body: string | undefined
        if (hasBody) {
          body = await new Promise<string>((resolve) => {
            let data = ''
            req.on('data', (chunk: Buffer) => { data += chunk.toString() })
            req.on('end', () => resolve(data))
          })
        }

        const request = new Request(url.toString(), {
          method: req.method,
          headers,
          body: hasBody ? body : undefined,
        })

        try {
          let response: Response

          if (req.url === '/api/auth/mobile-token' && req.method === 'POST') {
            const { handleMobileToken } = await server.ssrLoadModule('./src/server/mobile-auth.ts')
            response = await handleMobileToken(request)
          } else if (req.url === '/api/auth/refresh-token' && req.method === 'POST') {
            const { handleRefreshToken } = await server.ssrLoadModule('./src/server/mobile-auth.ts')
            response = await handleRefreshToken(request)
          } else if (req.url?.startsWith('/api/auth/webauthn/') && req.method === 'POST') {
            const { handleWebAuthnRequest } = await server.ssrLoadModule('./src/server/webauthn.ts')
            const webauthnResponse = await handleWebAuthnRequest(request)
            if (webauthnResponse) {
              response = webauthnResponse
            } else {
              const { handleAuthRequest } = await server.ssrLoadModule('./src/server/auth-handler.ts')
              response = await handleAuthRequest(request)
            }
          } else {
            const { handleAuthRequest } = await server.ssrLoadModule('./src/server/auth-handler.ts')
            response = await handleAuthRequest(request)
          }

          res.statusCode = response.status
          // Set-Cookie must be handled separately — forEach merges
          // multiple Set-Cookie headers into one invalid value.
          const setCookies = response.headers.getSetCookie()
          if (setCookies.length) {
            res.setHeader('set-cookie', setCookies)
          }
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() !== 'set-cookie') {
              res.setHeader(key, value)
            }
          })
          const responseBody = await response.text()
          res.end(responseBody)
        } catch (err) {
          console.error('Auth middleware error:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Internal server error' }))
        }
      })
    },
  }
}

const config = defineConfig({
  envDir: '../../',
  server: {
    watch: {
      ignored: ['**/routeTree.gen.ts'],
    },
  },
  ssr: {
    resolve: {
      conditions: ['bun'],
    },
  },
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    apiMiddleware(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
