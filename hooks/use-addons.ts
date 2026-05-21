'use client'

import useSWR from 'swr'
import { useDb } from './use-db'

// ── Addons ────────────────────────────────────────────────────────────────────

export function useActiveAddons() {
  const db = useDb()
  return useSWR(['addons', 'active'], async () => {
    const { data, error } = await db.addons.listActive()
    if (error) throw error
    return data
  })
}

export function useAddon(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['addons', 'byId', id] : null, async () => {
    const { data, error } = await db.addons.getById(id!)
    if (error) throw error
    return data
  })
}

export function useAddonByKey(key: string | null) {
  const db = useDb()
  return useSWR(key ? ['addons', 'byKey', key] : null, async () => {
    const { data, error } = await db.addons.getByKey(key!)
    if (error) throw error
    return data
  })
}

// ── Addon versions ────────────────────────────────────────────────────────────

export function useAddonVersion(versionId: number | null) {
  const db = useDb()
  return useSWR(versionId ? ['addons', 'version', versionId] : null, async () => {
    const { data, error } = await db.addons.getVersionById(versionId!)
    if (error) throw error
    return data
  })
}

export function useActiveAddonVersion(addonId: number | null) {
  const db = useDb()
  return useSWR(
    addonId ? ['addons', 'activeVersion', addonId] : null,
    async () => {
      const { data, error } = await db.addons.getActiveVersion(addonId!)
      if (error) throw error
      return data
    },
  )
}

export function useAddonVersionByProviderId(providerPriceId: string | null) {
  const db = useDb()
  return useSWR(
    providerPriceId ? ['addons', 'versionByProviderId', providerPriceId] : null,
    async () => {
      const { data, error } = await db.addons.getVersionByProviderId(providerPriceId!)
      if (error) throw error
      return data
    },
  )
}

export function useAddonVersionEntitlements(addonVersionId: number | null) {
  const db = useDb()
  return useSWR(
    addonVersionId ? ['addons', 'versionEntitlements', addonVersionId] : null,
    async () => {
      const { data, error } = await db.addons.listEntitlementsForVersion(addonVersionId!)
      if (error) throw error
      return data
    },
  )
}
