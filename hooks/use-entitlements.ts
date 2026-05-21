'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'

// ── Queries ───────────────────────────────────────────────────────────────────

export function useOrgEntitlements(orgId: number | null) {
  const db = useDb()
  return useSWR(orgId ? ['entitlements', 'byOrg', orgId] : null, async () => {
    const { data, error } = await db.entitlements.listForOrg(orgId!)
    if (error) throw error
    return data
  })
}

export function useSubscriptionEntitlements(subscriptionId: number | null) {
  const db = useDb()
  return useSWR(
    subscriptionId ? ['entitlements', 'bySubscription', subscriptionId] : null,
    async () => {
      const { data, error } = await db.entitlements.listForSubscription(subscriptionId!)
      if (error) throw error
      return data
    },
  )
}

export function useFeatureCheck(orgId: number | null, featureKey: string | null) {
  const db = useDb()
  return useSWR(
    orgId && featureKey ? ['entitlements', 'check', orgId, featureKey] : null,
    async () => {
      const { data, error } = await db.entitlements.checkFeature(orgId!, featureKey!)
      if (error) throw error
      return data
    },
  )
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useRecomputeEntitlements() {
  const db = useDb()
  return useCallback(
    (subscriptionId: number) => db.entitlements.recompute(subscriptionId),
    [db],
  )
}
