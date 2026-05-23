'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'
import type { Permission } from '@/types/permissions'

// ── Platform permissions ──────────────────────────────────────────────────────

export function useMyPlatformPermissions() {
  const db = useDb()
  return useSWR(['rbac', 'platform', 'me'], async () => {
    const { data, error } = await db.rbac.getMyPlatformPermissions()
    if (error) throw error
    return (data ?? []) as string[]
  })
}

export function useHasPlatformPermission(permission: Permission) {
  const { data } = useMyPlatformPermissions()
  return data?.includes(permission) ?? false
}

export function useIsPlatformAdmin() {
  return useHasPlatformPermission('platform.admin')
}

// ── Organization permissions ──────────────────────────────────────────────────

export function useMyOrgPermissions(orgId: number | null) {
  const db = useDb()
  return useSWR(
    orgId ? ['rbac', 'org', orgId, 'me'] : null,
    async () => {
      const { data, error } = await db.rbac.getMyOrgPermissions(orgId!)
      if (error) throw error
      return (data ?? []) as string[]
    },
  )
}

export function useHasOrgPermission(orgId: number | null, permission: Permission) {
  const { data } = useMyOrgPermissions(orgId)
  return data?.includes(permission) ?? false
}

// ── Organization roles ────────────────────────────────────────────────────────

export function useOrgRoles(orgId: number | null) {
  const db = useDb()
  return useSWR(
    orgId ? ['rbac', 'orgRoles', orgId] : null,
    async () => {
      const { data, error } = await db.rbac.listOrgRoles(orgId!)
      if (error) throw error
      return data
    },
  )
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useAssignPlatformRole() {
  const db = useDb()
  return useCallback(
    (accountId: number, platformRoleId: number, grantedByAccountId: number) =>
      db.rbac.assignPlatformRole(accountId, platformRoleId, grantedByAccountId),
    [db],
  )
}

export function useRevokePlatformRole() {
  const db = useDb()
  return useCallback(
    (accountId: number, platformRoleId: number) =>
      db.rbac.revokePlatformRole(accountId, platformRoleId),
    [db],
  )
}
