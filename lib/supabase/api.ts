import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { getSupabaseAdminClient } from './admin'
import { ApiKeyContext } from '@/lib/supabase/proxy'

/**
 * Creates a Supabase client for use inside Next.js Route Handlers that are
 * authenticated via an API key.
 *
 * The middleware (proxy.ts) validates the `x-api-key` header, exchanges it
 * for a short-lived session belonging to the service account that owns the
 * key, and writes that session into the request cookies before the route
 * handler runs.  This function reads those cookies, so:
 *
 *   - `auth.uid()` in RLS policies resolves to the service account's user ID
 *   - Row-level security is enforced as if the service account is signed in
 *   - No extra DB round-trip is needed inside the route handler
 *
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const supabase = getSupabaseApiClient(request)
 *   const { data } = await supabase.from('projects').select('*')
 * }
 * ```
 *
 * `setAll` is intentionally a no-op: the middleware creates a fresh session
 * for every API key request, so there is nothing to persist back to the
 * client, and there is no response object available at this call site.
 */
export async function getSupabaseApiClient(request: NextRequest) {
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op — see JSDoc above.
        },
      },
    },
  )
  const admin = getSupabaseAdminClient()
  const api_key_context = request.headers.get('x-api-key-context')
  if (!api_key_context) {
    throw new Error('Missing x-api-key header') // x-api-key-context is set by the middleware when x-api-key is present
  }
  const { accountId } = JSON.parse(api_key_context) as ApiKeyContext;
  const { data: account, error: accountError } = await admin.from('accounts').select('*').eq('id', accountId).single()
  if (accountError || !account) {
    throw new Error('Invalid account ID in x-api-key-context')
  }
  if (!account.user_id) {
    throw new Error('Account has no associated user ID')
  }
  const { data: user, error: userError } = await admin.auth.admin.getUserById(account.user_id)
  if (userError || !user) {
    throw new Error('Invalid user ID in x-api-key-context')
  }
  if (!user.user.email) {
    throw new Error('User has no email')
  }
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.user.email,
  })
  if (linkError || !linkData) {
    throw new Error('Failed to generate magic link for service account user')
  }
  const { data: sessionData, error: sessionError } = await client.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink'
  })

  if (sessionError || !sessionData?.session || !sessionData.session.access_token || !sessionData.session.refresh_token) {
    throw new Error('Failed to verify OTP for service account user')
  }

  await client.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });

  return client;
}
