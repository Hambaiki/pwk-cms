import { randomBytes } from 'crypto'
import * as bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'

export type KeyScope = 'public' | 'private'

export type CreatedApiKey = {
  id: string
  name: string
  rawKey: string   // shown ONCE to the user — never stored
  scope: KeyScope
  createdAt: Date
}

// ─── generateApiKey ───────────────────────────────────────────────────────────
// Creates a new API key, hashes it with bcrypt, and inserts the hash into the DB.
// Returns the raw key — the caller must display it to the user immediately.
// It cannot be recovered afterwards.

export async function generateApiKey(
  name: string,
  scope: KeyScope,
  createdBy: string,
  expiresAt?: Date,
): Promise<CreatedApiKey> {
  const prefix  = scope === 'public' ? 'pwk_pub_' : 'pwk_prv_'
  const entropy = randomBytes(32).toString('base64url')
  const rawKey  = `${prefix}${entropy}`

  const keyHash = await bcrypt.hash(rawKey, 10)

  const [row] = await db
    .insert(apiKeys)
    .values({ name, keyHash, scope, createdBy, expiresAt })
    .returning({ id: apiKeys.id, createdAt: apiKeys.createdAt })

  return { id: row.id, name, rawKey, scope, createdAt: row.createdAt }
}
