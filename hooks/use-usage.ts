'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'
import type { Database } from '@/types/database'

type UsageRecordInsert = Database['public']['Tables']['usage_records']['Insert']

// ── Queries ───────────────────────────────────────────────────────────────────

export function useUsageRecords(
  orgId: number | null,
  options?: {
    subscriptionId?: number
    featureKey?: string
    periodStart?: string
    periodEnd?: string
    limit?: number
  },
) {
  const db = useDb()
  return useSWR(
    orgId
      ? [
          'usage',
          'records',
          orgId,
          options?.subscriptionId,
          options?.featureKey,
          options?.periodStart,
          options?.periodEnd,
          options?.limit,
        ]
      : null,
    async () => {
      const { data, error } = await db.usage.listRecords(orgId!, options)
      if (error) throw error
      return data
    },
  )
}

export function useUsageSummary(
  orgId: number | null,
  subscriptionId: number | null,
  featureKey: string | null,
  periodStart: string | null,
  periodEnd: string | null,
) {
  const db = useDb()
  return useSWR(
    orgId && subscriptionId && featureKey && periodStart && periodEnd
      ? ['usage', 'summary', orgId, subscriptionId, featureKey, periodStart, periodEnd]
      : null,
    async () => {
      const { data, error } = await db.usage.getSummary(
        orgId!,
        subscriptionId!,
        featureKey!,
        periodStart!,
        periodEnd!,
      )
      if (error) throw error
      return data
    },
  )
}

export function useUsageSummaries(
  orgId: number | null,
  options?: {
    subscriptionId?: number
    featureKey?: string
    periodStart?: string
    periodEnd?: string
  },
) {
  const db = useDb()
  return useSWR(
    orgId
      ? [
          'usage',
          'summaries',
          orgId,
          options?.subscriptionId,
          options?.featureKey,
          options?.periodStart,
          options?.periodEnd,
        ]
      : null,
    async () => {
      const { data, error } = await db.usage.listSummaries(orgId!, options)
      if (error) throw error
      return data
    },
  )
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useRecordUsage() {
  const db = useDb()
  return useCallback((data: UsageRecordInsert) => db.usage.record(data), [db])
}
