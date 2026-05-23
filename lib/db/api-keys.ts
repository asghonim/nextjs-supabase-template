import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createApiKeysDb(supabase: SupabaseClient<Database>) {
  const db = supabase

  return {
    // ── Queries ───────────────────────────────────────────────────

    listByOrg(orgId: number) {
      return db
        .from('api_keys')
        .select('id, org_id, account_id, name, key_prefix, scopes, expires_at, last_used_at, revoked_at, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
    },

    getById(id: number) {
      return db
        .from('api_keys')
        .select('id, org_id, account_id, name, key_prefix, scopes, expires_at, last_used_at, revoked_at, created_at')
        .eq('id', id)
        .single()
    },

    // ── Mutations ──────────────────────────────────────────────────

    create(data: {
      org_id: number
      account_id: number
      name: string
      key_prefix: string
      key_hash: string
      scopes: string[]
      expires_at?: string | null
    }) {
      return db
        .from('api_keys')
        .insert(data)
        .select('id, org_id, account_id, name, key_prefix, scopes, expires_at, last_used_at, revoked_at, created_at')
        .single()
    },

    revoke(id: number) {
      return db
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, revoked_at')
        .single()
    },

    updateScopes(id: number, scopes: string[]) {
      return db
        .from('api_keys')
        .update({ scopes })
        .eq('id', id)
        .select('id, scopes')
        .single()
    },

    // ── Verification (admin client only) ──────────────────────────

    /** Verifies a key hash and bumps last_used_at. Use the admin client. */
    verify(keyHash: string) {
      return db.rpc('verify_api_key', { p_key_hash: keyHash })
    },
  }
}

export type ApiKeysDb = ReturnType<typeof createApiKeysDb>
