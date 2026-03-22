import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '#/lib/auth'

const endpoint = process.env.OBJECT_STORAGE_ENDPOINT!
const bucket = process.env.OBJECT_STORAGE_BUCKET!

const s3 = new S3Client({
  endpoint: `https://${endpoint}`,
  region: process.env.OBJECT_STORAGE_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.OBJECT_STORAGE_KEY!,
    secretAccessKey: process.env.OBJECT_STORAGE_SECRET!,
  },
  forcePathStyle: true,
})

/**
 * Handle GET /api/files?path=<key>
 * Streams the file from object storage through the web server,
 * so the browser never needs to reach the S3 endpoint directly.
 */
export async function handleFileProxy(req: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const filePath = url.searchParams.get('path')
    if (!filePath) {
      return Response.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    const command = new GetObjectCommand({ Bucket: bucket, Key: filePath })
    const result = await s3.send(command)

    if (!result.Body) {
      return Response.json({ error: 'File not found' }, { status: 404 })
    }

    const headers = new Headers()
    if (result.ContentType) headers.set('Content-Type', result.ContentType)
    if (result.ContentLength) headers.set('Content-Length', String(result.ContentLength))
    headers.set('Cache-Control', 'private, max-age=3600')

    return new Response(result.Body as ReadableStream, { headers })
  } catch (err: any) {
    console.error('[file-proxy] Error:', err)
    if (err.name === 'NoSuchKey') {
      return Response.json({ error: 'File not found' }, { status: 404 })
    }
    return Response.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}
