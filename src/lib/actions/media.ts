'use server'

import { revalidatePath } from 'next/cache'
import { eq, desc, like, and, count } from 'drizzle-orm'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { media } from '@/lib/db/schema'
import type { Media } from '@/lib/db/schema'
import { verifySession } from '@/lib/dal'
import { requireCollectionRole } from '@/lib/actions/collections'

const BUCKET = 'cms-media'
const MAX_FILE_SIZE = 50 * 1024 * 1024
const ACCEPTED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/avif', 'video/mp4', 'video/webm',
  'application/pdf', 'text/plain', 'text/csv', 'application/zip',
])

export type MediaListResult = {
  items: Media[]
  total: number
  page: number
  totalPages: number
}

export type UploadState = {
  errors?: { general?: string[] }
  uploaded?: Media[]
} | undefined

// ─── List media scoped to a collection ────────────────────────────────────────

export async function getMedia(opts: {
  collectionId: string
  search?: string
  mimePrefix?: string
  page?: number
  limit?: number
}): Promise<MediaListResult> {
  const session = await verifySession()
  await requireCollectionRole(opts.collectionId, session.userId, 'viewer')

  const page   = Math.max(1, opts.page  ?? 1)
  const limit  = Math.min(100, opts.limit ?? 40)
  const offset = (page - 1) * limit

  const conditions = [eq(media.collectionId, opts.collectionId)]
  if (opts.search)     conditions.push(like(media.filename, `%${opts.search}%`))
  if (opts.mimePrefix) conditions.push(like(media.mimeType, `${opts.mimePrefix}%`))

  const where = and(...conditions)

  try {
    const [items, [{ total }]] = await Promise.all([
      db.select().from(media).where(where).orderBy(desc(media.createdAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(media).where(where),
    ])
    return { items, total: Number(total), page, totalPages: Math.ceil(Number(total) / limit) }
  } catch {
    return { items: [], total: 0, page, totalPages: 0 }
  }
}

// ─── Upload ────────────────────────────────────────────────────────────────────

export async function uploadMedia(
  _state: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const session = await verifySession()

  const collectionId = formData.get('collectionId') as string | null
  if (!collectionId) return { errors: { general: ['Collection ID is required.'] } }

  await requireCollectionRole(collectionId, session.userId, 'editor')

  const files = formData.getAll('files') as File[]
  if (!files.length) return { errors: { general: ['No files provided.'] } }

  const supabase = await createSupabaseServer()
  const uploaded: Media[] = []
  const errors: string[] = []

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) { errors.push(`"${file.name}" exceeds 50 MB.`); continue }
    if (!ACCEPTED_MIME.has(file.type)) { errors.push(`"${file.name}" — unsupported type.`); continue }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${collectionId}/${session.userId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) { errors.push(`"${file.name}" failed: ${uploadError.message}`); continue }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    const [row] = await db
      .insert(media)
      .values({
        collectionId,
        filename:    file.name,
        storagePath,
        publicUrl,
        mimeType:    file.type,
        size:        file.size,
        width:       null,
        height:      null,
        uploadedBy:  session.userId,
      })
      .returning()

    uploaded.push(row)
  }

  revalidatePath(`/cms/media?collection=${collectionId}`)

  if (errors.length > 0 && uploaded.length === 0) {
    return { errors: { general: errors } }
  }
  return { uploaded, errors: errors.length ? { general: errors } : undefined }
}

// ─── Update alt text ───────────────────────────────────────────────────────────

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  const session = await verifySession()
  const [row] = await db.select({ collectionId: media.collectionId }).from(media).where(eq(media.id, id)).limit(1)
  if (!row) return
  await requireCollectionRole(row.collectionId, session.userId, 'editor')
  await db.update(media).set({ alt }).where(eq(media.id, id))
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  const session = await verifySession()

  const [row] = await db
    .select({ storagePath: media.storagePath, uploadedBy: media.uploadedBy, collectionId: media.collectionId })
    .from(media)
    .where(eq(media.id, id))
    .limit(1)

  if (!row) return { error: 'File not found.' }

  const role = await requireCollectionRole(row.collectionId, session.userId, 'editor').catch(() => null)
  if (!role) return { error: 'Permission denied.' }

  // Editors can only delete their own uploads; owners can delete any
  if (role === 'editor' && row.uploadedBy !== session.userId) {
    return { error: 'Permission denied.' }
  }

  const supabase = await createSupabaseServer()
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([row.storagePath])
  if (storageError) return { error: storageError.message }

  await db.delete(media).where(eq(media.id, id))
  revalidatePath(`/cms/media?collection=${row.collectionId}`)
  return {}
}
