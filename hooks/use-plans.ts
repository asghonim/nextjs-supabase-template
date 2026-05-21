'use client'

import useSWR from 'swr'
import { useDb } from './use-db'

// ── Plans ─────────────────────────────────────────────────────────────────────

export function usePublicPlans() {
  const db = useDb()
  return useSWR(['plans', 'public'], async () => {
    const { data, error } = await db.plans.listPublic()
    if (error) throw error
    return data
  })
}

export function usePlans() {
  const db = useDb()
  return useSWR(['plans', 'all'], async () => {
    const { data, error } = await db.plans.listAll()
    if (error) throw error
    return data
  })
}

export function usePlan(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['plans', 'byId', id] : null, async () => {
    const { data, error } = await db.plans.getById(id!)
    if (error) throw error
    return data
  })
}

export function usePlanBySlug(slug: string | null) {
  const db = useDb()
  return useSWR(slug ? ['plans', 'bySlug', slug] : null, async () => {
    const { data, error } = await db.plans.getBySlug(slug!)
    if (error) throw error
    return data
  })
}

// ── Plan versions ─────────────────────────────────────────────────────────────

export function usePlanVersion(versionId: number | null) {
  const db = useDb()
  return useSWR(versionId ? ['plans', 'version', versionId] : null, async () => {
    const { data, error } = await db.plans.getVersionById(versionId!)
    if (error) throw error
    return data
  })
}

export function useActivePlanVersion(planId: number | null) {
  const db = useDb()
  return useSWR(
    planId ? ['plans', 'activeVersion', planId] : null,
    async () => {
      const { data, error } = await db.plans.getActiveVersion(planId!)
      if (error) throw error
      return data
    },
  )
}

export function usePlanVersionByProviderId(providerPriceId: string | null) {
  const db = useDb()
  return useSWR(
    providerPriceId ? ['plans', 'versionByProviderId', providerPriceId] : null,
    async () => {
      const { data, error } = await db.plans.getVersionByProviderId(providerPriceId!)
      if (error) throw error
      return data
    },
  )
}

// ── Features ──────────────────────────────────────────────────────────────────

export function useFeatures() {
  const db = useDb()
  return useSWR(['plans', 'features'], async () => {
    const { data, error } = await db.plans.listFeatures()
    if (error) throw error
    return data
  })
}

export function useFeature(key: string | null) {
  const db = useDb()
  return useSWR(key ? ['plans', 'feature', key] : null, async () => {
    const { data, error } = await db.plans.getFeatureByKey(key!)
    if (error) throw error
    return data
  })
}

export function usePlanVersionEntitlements(planVersionId: number | null) {
  const db = useDb()
  return useSWR(
    planVersionId ? ['plans', 'versionEntitlements', planVersionId] : null,
    async () => {
      const { data, error } = await db.plans.listEntitlementsForVersion(planVersionId!)
      if (error) throw error
      return data
    },
  )
}
