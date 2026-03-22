import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

const environment = process.env.NODE_ENV === 'development' ? 'dev' : 'prod'

/**
 * Upload a file buffer to RustFS object storage and return a signed URL.
 */
export async function uploadFile(
  file: File | Buffer,
  basePath: string,
  fileName: string,
  contentType: string,
): Promise<{ filePath: string; signedUrl: string; fileSize: number }> {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = `${environment}/${basePath}/${timestamp}-${sanitizedFileName}`

  const buffer = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await (file as File).arrayBuffer())

  console.log('[storage] Uploading:', { filePath, fileSize: buffer.length, contentType })

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  console.log('[storage] Upload successful:', filePath)

  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: filePath }),
    { expiresIn: 3600 },
  )

  return { filePath, signedUrl, fileSize: buffer.length }
}
