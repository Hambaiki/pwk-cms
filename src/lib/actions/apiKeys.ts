'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { verifySession } from '@/lib/dal'
import { generateApiKey } from '@/lib/api/keys'
import { requireCollectionRole } from '@/lib/actions/collections'

export type ApiKeyRow = {
  id:           string
  collectionId: string
  name:         string
  scope:        'public' | 'private'
  createdAt:    Date
  expiresAt:    Date | null
  lastUsedAt:   Date | null
  revokedAt:    Date | null
}

export type CreateKeyState = {
  errors?: { name?: string[]; general?: string[] }
  created?: { rawKey: string; name: string; scope: 'public' | 'private' }
} | undefined

const CreateKeySchema = z.object({
  collectionId: z.string().uuid(),
  name:         z.string().min(1, 'Name is required').max(64).trim(),
  scope:        z.enum(['public', 'private']),
  expiresAt:    z.string().optional(),
})

// ─── List keys for a collection ────────────────────────────────────────────────

export async function getApiKeys(collectionId: string): Promise<ApiKeyRow[]> {
  const session = await verifySession()
  await requireCollectionRole(collectionId, session.userId, 'owner')

  try {
    const rows = await db
      .select({
        id:           apiKeys.id,
        collectionId: apiKeys.collectionId,
        name:         apiKeys.name,
        scope:        apiKeys.scope,
        createdAt:    apiKeys.createdAt,
        expiresAt:    apiKeys.expiresAt,
        lastUsedAt:   apiKeys.lastUsedAt,
        revokedAt:    apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.collectionId, collectionId))
      .orderBy(desc(apiKeys.createdAt))
    return rows as ApiKeyRow[]
  } catch {
    return []
  }
}

// ─── Create key ────────────────────────────────────────────────────────────────

export async function createApiKey(
  _state: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const session = await verifySession()

  const validated = CreateKeySchema.safeParse({
    collectionId: formData.get('collectionId'),
    name:         formData.get('name'),
    scope:        formData.get('scope'),
    expiresAt:    formData.get('expiresAt') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { collectionId, name, scope, expiresAt: expiresRaw } = validated.data

  await requireCollectionRole(collectionId, session.userId, 'owner')

  let expiresAt: Date | undefined
  if (expiresRaw) {
    expiresAt = new Date(expiresRaw)
    if (isNaN(expiresAt.getTime())) {
      return { errors: { general: ['Invalid expiry date.'] } }
    }
  }

  const created = await generateApiKey(name, scope, session.userId, expiresAt, collectionId)

  revalidatePath(`/cms/collections/${collectionId}`)
  return { created: { rawKey: created.rawKey, name: created.name, scope: created.scope } }
}

// ─── Revoke key ────────────────────────────────────────────────────────────────

export async function revokeApiKey(id: string): Promise<void> {
  const session = await verifySession()

  const [key] = await db
    .select({ collectionId: apiKeys.collectionId, createdBy: apiKeys.createdBy })
    .from(apiKeys)
    .where(eq(apiKeys.id, id))
    .limit(1)

  if (!key) return

  await requireCollectionRole(key.collectionId, session.userId, 'owner')
  await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id))
  revalidatePath(`/cms/collections/${key.collectionId}`)
}
