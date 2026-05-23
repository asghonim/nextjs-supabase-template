import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createApiKeysDb } from '@/lib/db/api-keys'
import { hashApiKey } from '@/lib/api-keys'

export type ApiKeyContext = {
  keyId:     number
  orgId:     number
  accountId: number
  scopes:    string[]
  expiresAt: string
}

/** Header name used to forward verified API key context to route handlers. */
export const API_KEY_CONTEXT_HEADER = 'x-api-key-context'

/**
 * Update session and enforce route protection.
 *
 * When the `x-api-key` header is present the request is authenticated via
 * the API key instead of the session cookie:
 *   - The key hash is looked up in the database (admin client, bypasses RLS).
 *   - On success the verified identity is forwarded to the route handler via
 *     the `x-api-key-context` request header.
 *   - On failure a 401 JSON response is returned immediately.
 *
 * The `x-api-key-context` header is always stripped from incoming requests
 * before being re-set (or not) by this middleware, preventing clients from
 * spoofing a verified identity.
 */
export async function updateSession(request: NextRequest) {
  // ── Strip incoming context header to prevent spoofing ───────────────────────
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(API_KEY_CONTEXT_HEADER)

  // ── API key authentication path ─────────────────────────────────────────────
  const rawApiKey = request.headers.get('x-api-key')

  if (rawApiKey) {
    const keyHash = hashApiKey(rawApiKey)
    const admin = getSupabaseAdminClient()
    const apiKeysDb = createApiKeysDb(admin)
    const { data, error } = await apiKeysDb.verify(keyHash)

    if (error) {
      console.error('[proxy] api key verify error', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const row = data?.[0]
    if (!row) {
      return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 })
    }

    const ctx: ApiKeyContext = {
      keyId:     row.id,
      orgId:     row.org_id,
      accountId: row.account_id,
      scopes:    row.scopes,
      expiresAt: row.expires_at,
    }
    requestHeaders.set(API_KEY_CONTEXT_HEADER, JSON.stringify(ctx));

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── Cookie-based session path (unchanged) ───────────────────────────────────
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) => {
            const cookieOptions = options as Record<string, unknown> | undefined
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getClaims().
  // A simple mistake could make it very hard to debug users being randomly logged out.
  await supabase.auth.getClaims()

  return supabaseResponse
}
