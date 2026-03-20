import { randomBytes } from 'crypto'
import * as bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'

export type KeyScope = 'public' | 'private'

export type CreatedApiKey = {
  id:           string
  name:         string
  rawKey:       string
  scope:        KeyScope
  collectionId: string
  createdAt:    Date
}

export async function generateApiKey(
  name:         string,
  scope:        KeyScope,
  createdBy:    string,
  expiresAt?:   Date,
  collectionId?: string,
): Promise<CreatedApiKey> {
  if (!collectionId) throw new Error('collectionId is required')

  const prefix  = scope === 'public' ? 'pwk_pub_' : 'pwk_prv_'
  const entropy = randomBytes(32).toString('base64url')
  const rawKey  = `${prefix}${entropy}`
  const keyHash = await bcrypt.hash(rawKey, 10)

  const [row] = await db
    .insert(apiKeys)
    .values({ name, keyHash, scope, createdBy, expiresAt, collectionId })
    .returning({ id: apiKeys.id, createdAt: apiKeys.createdAt })

  return { id: row.id, name, rawKey, scope, collectionId, createdAt: row.createdAt }
}
