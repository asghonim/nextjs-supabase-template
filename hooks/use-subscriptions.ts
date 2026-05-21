'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'
import type { Database } from '@/types/database'

type ChangeRequestInsert = Database['public']['Tables']['subscription_change_requests']['Insert']
type ChangeRequestStatus = Database['public']['Enums']['change_request_status']

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function useSubscription(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['subscriptions', 'byId', id] : null, async () => {
    const { data, error } = await db.subscriptions.getById(id!)
    if (error) throw error
    return data
  })
}

export function useActiveSubscription(orgId: number | null) {
  const db = useDb()
  return useSWR(
    orgId ? ['subscriptions', 'active', orgId] : null,
    async () => {
      const { data, error } = await db.subscriptions.getActiveForOrg(orgId!)
      if (error) throw error
      return data
    },
  )
}

export function useSubscriptions(orgId: number | null) {
  const db = useDb()
  return useSWR(orgId ? ['subscriptions', 'byOrg', orgId] : null, async () => {
    const { data, error } = await db.subscriptions.listForOrg(orgId!)
    if (error) throw error
    return data
  })
}

export function useSubscriptionByProviderId(providerSubscriptionId: string | null) {
  const db = useDb()
  return useSWR(
    providerSubscriptionId
      ? ['subscriptions', 'byProviderId', providerSubscriptionId]
      : null,
    async () => {
      const { data, error } = await db.subscriptions.getByProviderSubscriptionId(
        providerSubscriptionId!,
      )
      if (error) throw error
      return data
    },
  )
}

// ── Subscription addons ───────────────────────────────────────────────────────

export function useSubscriptionAddons(subscriptionId: number | null) {
  const db = useDb()
  return useSWR(
    subscriptionId ? ['subscriptions', 'addons', subscriptionId] : null,
    async () => {
      const { data, error } = await db.subscriptions.listAddons(subscriptionId!)
      if (error) throw error
      return data
    },
  )
}

export function useActiveSubscriptionAddons(subscriptionId: number | null) {
  const db = useDb()
  return useSWR(
    subscriptionId ? ['subscriptions', 'activeAddons', subscriptionId] : null,
    async () => {
      const { data, error } = await db.subscriptions.getActiveAddons(subscriptionId!)
      if (error) throw error
      return data
    },
  )
}

// ── Change requests ───────────────────────────────────────────────────────────

export function useChangeRequest(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['subscriptions', 'changeRequest', id] : null, async () => {
    const { data, error } = await db.subscriptions.getChangeRequest(id!)
    if (error) throw error
    return data
  })
}

export function useChangeRequestByIdempotencyKey(key: string | null) {
  const db = useDb()
  return useSWR(
    key ? ['subscriptions', 'changeRequestByKey', key] : null,
    async () => {
      const { data, error } = await db.subscriptions.getChangeRequestByIdempotencyKey(key!)
      if (error) throw error
      return data
    },
  )
}

export function useChangeRequests(
  subscriptionId: number | null,
  options?: { status?: ChangeRequestStatus },
) {
  const db = useDb()
  return useSWR(
    subscriptionId
      ? ['subscriptions', 'changeRequests', subscriptionId, options?.status]
      : null,
    async () => {
      const { data, error } = await db.subscriptions.listChangeRequests(
        subscriptionId!,
        options,
      )
      if (error) throw error
      return data
    },
  )
}

export function useOrgChangeRequests(
  orgId: number | null,
  options?: { status?: ChangeRequestStatus },
) {
  const db = useDb()
  return useSWR(
    orgId ? ['subscriptions', 'orgChangeRequests', orgId, options?.status] : null,
    async () => {
      const { data, error } = await db.subscriptions.listOrgChangeRequests(orgId!, options)
      if (error) throw error
      return data
    },
  )
}

// ── Subscription events ───────────────────────────────────────────────────────

export function useSubscriptionEvents(
  orgId: number | null,
  options?: { subscriptionId?: number; limit?: number },
) {
  const db = useDb()
  return useSWR(
    orgId
      ? ['subscriptions', 'events', orgId, options?.subscriptionId, options?.limit]
      : null,
    async () => {
      const { data, error } = await db.subscriptions.listEvents(orgId!, options)
      if (error) throw error
      return data
    },
  )
}

// ── Contracts ─────────────────────────────────────────────────────────────────

export function useContracts(orgId: number | null) {
  const db = useDb()
  return useSWR(orgId ? ['subscriptions', 'contracts', orgId] : null, async () => {
    const { data, error } = await db.subscriptions.listContracts(orgId!)
    if (error) throw error
    return data
  })
}

export function useContract(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['subscriptions', 'contract', id] : null, async () => {
    const { data, error } = await db.subscriptions.getContract(id!)
    if (error) throw error
    return data
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateChangeRequest() {
  const db = useDb()
  return useCallback(
    (data: ChangeRequestInsert) => db.subscriptions.createChangeRequest(data),
    [db],
  )
}
