'use client'

import useSWR from 'swr'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { createContactDb, type ContactStatus, type ContactSubmissionRow, type ContactMessageRow } from '@/lib/db/contact'

function getDb() {
  return createContactDb(getSupabaseBrowserClient())
}

export function useContactSubmissions(opts?: {
  status?: ContactStatus
  limit?:  number
  offset?: number
}) {
  return useSWR<ContactSubmissionRow[]>(
    ['contact_submissions', opts],
    async () => {
      const { data, error } = await getDb().listSubmissions(opts)
      if (error) throw error
      return data ?? []
    },
  )
}

export function useContactSubmission(id: string | null) {
  return useSWR<ContactSubmissionRow | null>(
    id ? ['contact_submission', id] : null,
    async () => {
      if (!id) return null
      const { data, error } = await getDb().getSubmission(id)
      if (error) throw error
      return data
    },
  )
}

export function useContactMessages(submissionId: string | null) {
  return useSWR<ContactMessageRow[]>(
    submissionId ? ['contact_messages', submissionId] : null,
    async () => {
      if (!submissionId) return []
      const { data, error } = await getDb().listMessages(submissionId)
      if (error) throw error
      return data ?? []
    },
  )
}
