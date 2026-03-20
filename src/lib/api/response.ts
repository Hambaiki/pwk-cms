import { NextResponse } from 'next/server'

// ─── Standard response shapes ─────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function paginated<T>(
  data: T[],
  meta: { page: number; limit: number; total: number },
) {
  return NextResponse.json({
    data,
    meta: {
      page:       meta.page,
      limit:      meta.limit,
      total:      meta.total,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  })
}

export function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

// Convenience aliases
export const notFound    = (msg = 'Not found')        => err(msg, 404)
export const unauthorized = (msg = 'Unauthorized')    => err(msg, 401)
export const forbidden   = (msg = 'Forbidden')        => err(msg, 403)
export const badRequest  = (msg = 'Bad request')      => err(msg, 400)
export const serverError = (msg = 'Server error')     => err(msg, 500)

// ─── Pagination helpers ───────────────────────────────────────────────────────

export function parsePagination(searchParams: URLSearchParams) {
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

// ─── CORS headers (optional — enable for browser-side external consumers) ─────

export function withCors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  return res
}
