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
