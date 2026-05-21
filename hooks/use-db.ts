'use client'

import { useMemo } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { createDb } from '@/lib/db'

export function useDb() {
  return useMemo(() => createDb(getSupabaseBrowserClient()), [])
}
