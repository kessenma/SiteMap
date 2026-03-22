import { uploadFile } from './storage'
import { auth } from '#/lib/auth'

/**
 * Handle POST /api/upload — accepts multipart/form-data with a single file field.
 * Returns { signedUrl, filePath } on success.
 */
export async function handleUpload(req: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const folder = (formData.get('folder') as string) || 'maps'
    const result = await uploadFile(file, folder, file.name, file.type || 'application/octet-stream')

    return Response.json(result)
  } catch (err: any) {
    console.error('[upload-handler] Error:', err)
    return Response.json(
      { error: err.message || 'Upload failed' },
      { status: 500 },
    )
  }
}
