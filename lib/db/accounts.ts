import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']

export function createAccountsDb(supabase: SupabaseClient<Database>) {
  return {
    getById(id: number) {
      return supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single()
    },

    getByUserId(userId: string) {
      return supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .single()
    },

    /** Returns the account for the currently authenticated user. */
    getCurrent() {
      return supabase
        .from('accounts')
        .select('*')
        .single()
    },
  }
}

export type AccountsDb = ReturnType<typeof createAccountsDb>
export type { AccountRow }
