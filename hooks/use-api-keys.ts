'use client'

import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { useDb } from './use-db'
import { generateApiKey } from '@/lib/api-keys'
import type { Database } from '@/types/database'

type ApiKeyRow = Omit<Database['public']['Tables']['api_keys']['Row'], 'key_hash'>

// ── Queries ───────────────────────────────────────────────────────────────────

export function useApiKeys(orgId: number | null) {
  const db = useDb()
  return useSWR(
    orgId ? ['apiKeys', 'byOrg', orgId] : null,
    async () => {
      const { data, error } = await db.apiKeys.listByOrg(orgId!)
      if (error) throw error
      return data as ApiKeyRow[]
    },
  )
}

export function useApiKey(id: number | null) {
  const db = useDb()
  return useSWR(
    id ? ['apiKeys', id] : null,
    async () => {
      const { data, error } = await db.apiKeys.getById(id!)
      if (error) throw error
      return data as ApiKeyRow
    },
  )
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export interface CreateApiKeyInput {
  orgId: number
  accountId: number
  name: string
  scopes: string[]
  expiresAt?: string | null
}

export interface CreateApiKeyResult {
  /** The created key record (without plaintext). */
  record: ApiKeyRow
  /** Full plaintext key — show once and discard. */
  plaintext: string
}

export function useCreateApiKey() {
  const db = useDb()
  const { mutate } = useSWRConfig()

  return useCallback(
    async (input: CreateApiKeyInput): Promise<CreateApiKeyResult> => {
      const { key, hash, prefix } = generateApiKey()

      const { data, error } = await db.apiKeys.create({
        org_id: input.orgId,
        account_id: input.accountId,
        name: input.name,
        key_prefix: prefix,
        key_hash: hash,
        scopes: input.scopes,
        expires_at: input.expiresAt ?? null,
      })

      if (error) throw error

      await mutate(['apiKeys', 'byOrg', input.orgId])

      return { record: data!, plaintext: key }
    },
    [db, mutate],
  )
}

export function useRevokeApiKey() {
  const db = useDb()
  const { mutate } = useSWRConfig()

  return useCallback(
    async (id: number, orgId: number) => {
      const { data, error } = await db.apiKeys.revoke(id)
      if (error) throw error

      await mutate(['apiKeys', 'byOrg', orgId])
      await mutate(['apiKeys', id])

      return data
    },
    [db, mutate],
  )
}

export function useUpdateApiKeyScopes() {
  const db = useDb()
  const { mutate } = useSWRConfig()

  return useCallback(
    async (id: number, orgId: number, scopes: string[]) => {
      const { data, error } = await db.apiKeys.updateScopes(id, scopes)
      if (error) throw error

      await mutate(['apiKeys', 'byOrg', orgId])
      await mutate(['apiKeys', id])

      return data
    },
    [db, mutate],
  )
}
