import { type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiKeys, profiles } from '@/lib/db/schema'
import { unauthorized, forbidden } from './response'
import { cookies } from 'next/headers'
import * as bcrypt from 'bcryptjs'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiContext = {
  scope: 'public' | 'private' | 'session'
  userId?: string
}

type RouteHandler = (
  req: NextRequest,
  ctx: ApiContext,
  params: Record<string, string>,
) => Promise<Response>

// ─── Key extraction ───────────────────────────────────────────────────────────
// Accept key in two places:
//   1. Authorization: Bearer <key>
//   2. X-API-Key: <key>

function extractKey(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  return req.headers.get('x-api-key')
}

// ─── Verify API key against the DB ───────────────────────────────────────────

async function verifyApiKey(rawKey: string): Promise<{
  scope: 'public' | 'private'
  createdBy: string | null
} | null> {
  // API keys are prefixed: pwk_pub_<random> or pwk_prv_<random>
  // We hash the raw key and compare against stored hashes.
  // bcrypt compare is intentionally slow — consider caching verified keys
  // in memory with a short TTL (30s) in production.

  const rows = await db
    .select({
      keyHash:   apiKeys.keyHash,
      scope:     apiKeys.scope,
      createdBy: apiKeys.createdBy,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)

  for (const row of rows) {
    if (row.revokedAt) continue
    if (row.expiresAt && row.expiresAt < new Date()) continue

    const match = await bcrypt.compare(rawKey, row.keyHash)
    if (match) {
      // Record last used — fire and forget
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.keyHash, row.keyHash))
        .catch(() => {})

      return { scope: row.scope, createdBy: row.createdBy }
    }
  }

  return null
}

// ─── withPublicKey ────────────────────────────────────────────────────────────
// Allows:
//   - valid public-scoped API key
//   - no key at all (anonymous public access)
// Rejects: private-scoped API keys on public routes

export function withPublicKey(handler: RouteHandler) {
  return async (req: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const resolvedParams = await params
    const rawKey = extractKey(req)

    if (rawKey) {
      const verified = await verifyApiKey(rawKey)
      if (!verified) return unauthorized('Invalid API key')
      if (verified.scope === 'private') return forbidden('Private keys cannot access public endpoints. Use a public key.')
      return handler(req, { scope: 'public', userId: verified.createdBy ?? undefined }, resolvedParams)
    }

    // No key — allow anonymous read
    return handler(req, { scope: 'public' }, resolvedParams)
  }
}

// ─── withPrivateKey ───────────────────────────────────────────────────────────
// Requires a valid private-scoped API key.
// Rejects: no key, public key, invalid key.

export function withPrivateKey(handler: RouteHandler) {
  return async (req: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const resolvedParams = await params
    const rawKey = extractKey(req)

    if (!rawKey) return unauthorized('API key required. Pass it as Authorization: Bearer <key> or X-API-Key header.')

    const verified = await verifyApiKey(rawKey)
    if (!verified) return unauthorized('Invalid or expired API key')
    if (verified.scope === 'public') return forbidden('This endpoint requires a private API key')

    return handler(req, { scope: 'private', userId: verified.createdBy ?? undefined }, resolvedParams)
  }
}

// ─── withSession ──────────────────────────────────────────────────────────────
// Requires a valid Supabase session (JWT in cookie).
// Used by future admin endpoints that are called from the CMS itself
// rather than by external API consumers.

export function withSession(handler: RouteHandler) {
  return async (req: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const resolvedParams = await params
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const { data, error } = await supabase.auth.getClaims()
    if (error || !data?.claims?.sub) return unauthorized()

    return handler(req, { scope: 'session', userId: data.claims.sub as string }, resolvedParams)
  }
}
