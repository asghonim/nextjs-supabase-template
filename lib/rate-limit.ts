import { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

const WINDOW_HOURS = 1
const MAX_PER_WINDOW = 5
const RATE_LIMIT_KEYS = {
  'CONTACT_SUBMISSION': 'contact_submission',
}

export async function isRateLimited(supabase: SupabaseClient<Database>,
  ip: string,
  key: keyof typeof RATE_LIMIT_KEYS): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_HOURS * 3_600_000).toISOString()

  if (!(key in RATE_LIMIT_KEYS)) {
    throw new Error(`Invalid rate limit key: ${key}`)
  }

  if (key === 'CONTACT_SUBMISSION') {
    const { count } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', since)

    return (count ?? 0) >= MAX_PER_WINDOW
  }
  return false
}
