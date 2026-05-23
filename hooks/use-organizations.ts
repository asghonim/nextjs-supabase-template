'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'
import type { Database } from '@/types/database'

type OrgInsert = Database['public']['Tables']['organizations']['Insert']

// ── Queries ──────────────────────────────────────────────────────────────────

export function useOrganization(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['organizations', 'byId', id] : null, async () => {
    const { data, error } = await db.organizations.getById(id!)
    if (error) throw error
    return data
  })
}

export function useOrganizationBySlug(slug: string | null) {
  const db = useDb()
  return useSWR(slug ? ['organizations', 'bySlug', slug] : null, async () => {
    const { data, error } = await db.organizations.getBySlug(slug!)
    if (error) throw error
    return data
  })
}

export function useOrganizationsByAccount(accountId: number | null) {
  const db = useDb()
  return useSWR(
    accountId ? ['organizations', 'byAccount', accountId] : null,
    async () => {
      const { data, error } = await db.organizations.listByAccountId(accountId!)
      if (error) throw error
      return data
    },
  )
}

export function useOrgMembers(orgId: number | null) {
  const db = useDb()
  return useSWR(orgId ? ['organizations', 'members', orgId] : null, async () => {
    const { data, error } = await db.organizations.listMembers(orgId!)
    if (error) throw error
    return data
  })
}

export function useOrgMember(orgId: number | null, accountId: number | null) {
  const db = useDb()
  return useSWR(
    orgId && accountId ? ['organizations', 'member', orgId, accountId] : null,
    async () => {
      const { data, error } = await db.organizations.getMember(orgId!, accountId!)
      if (error) throw error
      return data
    },
  )
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateOrganization() {
  const db = useDb()
  return useCallback((data: OrgInsert) => db.organizations.create(data), [db])
}

export function useAddOrgMember() {
  const db = useDb()
  return useCallback(
    (orgId: number, accountId: number, organizationRoleId?: number, invitedByAccountId?: number) =>
      db.organizations.addMember(orgId, accountId, organizationRoleId, invitedByAccountId),
    [db],
  )
}

export function useUpdateMemberRole() {
  const db = useDb()
  return useCallback(
    (memberId: number, organizationRoleId: number | null) =>
      db.organizations.updateMemberRole(memberId, organizationRoleId),
    [db],
  )
}

export function useRemoveOrgMember() {
  const db = useDb()
  return useCallback((memberId: number) => db.organizations.removeMember(memberId), [db])
}
