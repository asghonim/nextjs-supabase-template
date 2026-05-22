'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'

export function useCurrentAccount() {
  const db = useDb()
  return useSWR(['accounts', 'current'], async () => {
    const { data, error } = await db.accounts.getCurrent()
    if (error) throw error
    return data
  })
}

export function useAccount(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['accounts', 'byId', id] : null, async () => {
    const { data, error } = await db.accounts.getById(id!)
    if (error) throw error
    return data
  })
}

export function useAccountByUserId(userId: string | null) {
  const db = useDb()
  return useSWR(userId ? ['accounts', 'byUserId', userId] : null, async () => {
    const { data, error } = await db.accounts.getByUserId(userId!)
    if (error) throw error
    return data
  })
}

// ── Names ─────────────────────────────────────────────────────────────────────

export function useAccountNames(accountId: number | null) {
  const db = useDb()
  return useSWR(accountId ? ['accounts', 'names', accountId] : null, async () => {
    const { data, error } = await db.accounts.listNames(accountId!)
    if (error) throw error
    return data
  })
}

export function useLatestAccountName(accountId: number | null) {
  const db = useDb()
  return useSWR(accountId ? ['accounts', 'names', accountId, 'latest'] : null, async () => {
    const { data, error } = await db.accounts.latestName(accountId!)
    if (error) throw error
    return data
  })
}

export function useInsertAccountName() {
  const db = useDb()
  return useCallback(
    (accountId: number, name: string) => db.accounts.insertName(accountId, name),
    [db],
  )
}

// ── Avatars ───────────────────────────────────────────────────────────────────

export function useAccountAvatars(accountId: number | null) {
  const db = useDb()
  return useSWR(accountId ? ['accounts', 'avatars', accountId] : null, async () => {
    const { data, error } = await db.accounts.listAvatars(accountId!)
    if (error) throw error
    return data
  })
}

export function useLatestAccountAvatar(accountId: number | null) {
  const db = useDb()
  return useSWR(accountId ? ['accounts', 'avatars', accountId, 'latest'] : null, async () => {
    const { data, error } = await db.accounts.latestAvatar(accountId!)
    if (error) throw error
    return data
  })
}

export function useInsertAccountAvatar() {
  const db = useDb()
  return useCallback(
    (accountId: number, url: string) => db.accounts.insertAvatar(accountId, url),
    [db],
  )
}
