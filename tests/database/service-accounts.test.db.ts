/**
 * Integration tests for the postServiceAccount route handler.
 *
 * Tests the full flow end-to-end against a real Supabase instance:
 *   - Authentication / validation guards (401, 400, 403)
 *   - Success path: auth user created, accounts row exists,
 *     org membership added, api_key row created
 *
 * @/lib/supabase/server is mocked so the handler receives a real
 * signed-in Supabase client without needing Next.js cookie machinery.
 */

import { afterAll, beforeAll, describe, expect, it, vi, type MockedFunction } from 'vitest'
import { NextRequest } from 'next/server'
import {
  admin,
  addOrgMember,
  createTestOrg,
  createTestUser,
  deleteTestUser,
  uniqueSlug,
  type TestOrg,
  type TestUser,
} from './helpers'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { postServiceAccount } from '@/lib/api/service-accounts'

const mockCreateClient = createClient as MockedFunction<typeof createClient>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/service-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('postServiceAccount', () => {
  let owner: TestUser
  let outsider: TestUser
  let org: TestOrg

  // Resources created by the handler during tests; cleaned up in afterAll
  const createdAuthUserIds: string[] = []
  const createdKeyIds: number[] = []

  beforeAll(async () => {
    owner    = await createTestUser('svc-owner')
    outsider = await createTestUser('svc-outsider')
    org      = await createTestOrg(owner.accountId, uniqueSlug('svc-test'))
    await addOrgMember(org.id, owner.accountId, 'owner')
    // outsider is deliberately not added to the org
  })

  afterAll(async () => {
    if (createdKeyIds.length > 0) {
      await admin.from('api_keys').delete().in('id', createdKeyIds)
    }
    for (const userId of createdAuthUserIds) {
      // Cascades to accounts row and organization_members
      await admin.auth.admin.deleteUser(userId)
    }
    await admin.from('organizations').delete().eq('id', org.id)
    await deleteTestUser(owner.id)
    await deleteTestUser(outsider.id)
  })

  // ── 401 ──────────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: null }, error: new Error('no session') }) },
    } as any)

    const res = await postServiceAccount(makeRequest({ orgId: org.id, username: 'bot' }))
    expect(res.status).toBe(401)
  })

  // ── 400 ──────────────────────────────────────────────────────────────────────

  it('returns 400 when orgId is missing', async () => {
    mockCreateClient.mockResolvedValueOnce(owner.client as any)
    const res = await postServiceAccount(makeRequest({ username: 'bot' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/orgId/)
  })

  it('returns 400 when orgId is not an integer', async () => {
    mockCreateClient.mockResolvedValueOnce(owner.client as any)
    const res = await postServiceAccount(makeRequest({ orgId: 'abc', username: 'bot' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when orgId is zero', async () => {
    mockCreateClient.mockResolvedValueOnce(owner.client as any)
    const res = await postServiceAccount(makeRequest({ orgId: 0, username: 'bot' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when username is missing', async () => {
    mockCreateClient.mockResolvedValueOnce(owner.client as any)
    const res = await postServiceAccount(makeRequest({ orgId: org.id }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/username/)
  })

  it('returns 400 when username starts with a hyphen', async () => {
    mockCreateClient.mockResolvedValueOnce(owner.client as any)
    const res = await postServiceAccount(makeRequest({ orgId: org.id, username: '-bad-name' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/username/)
  })

  it('returns 400 when username is a single character', async () => {
    mockCreateClient.mockResolvedValueOnce(owner.client as any)
    const res = await postServiceAccount(makeRequest({ orgId: org.id, username: 'a' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/username/)
  })

  // ── 403 ──────────────────────────────────────────────────────────────────────

  it('returns 403 when caller is not an org member', async () => {
    mockCreateClient.mockResolvedValueOnce(outsider.client as any)
    const res = await postServiceAccount(makeRequest({ orgId: org.id, username: 'bot' }))
    expect(res.status).toBe(403)
  })

  // ── 201 success ───────────────────────────────────────────────────────────────

  describe('success (org owner creates a service account)', () => {
    type SuccessBody = {
      email: string
      userId: string
      apiKey: {
        id: number
        account_id: number
        org_id: number
        name: string
        key: string
        key_prefix: string
      }
    }

    let body: SuccessBody

    beforeAll(async () => {
      mockCreateClient.mockResolvedValueOnce(owner.client as any)
      const res = await postServiceAccount(makeRequest({ orgId: org.id, username: 'my-bot' }))
      expect(res.status).toBe(201)
      body = await res.json()
      createdAuthUserIds.push(body.userId)
      createdKeyIds.push(body.apiKey.id)
    })

    it('returns an email with the service domain pattern', () => {
      expect(body.email).toMatch(/^my-bot@service\.qrserver-[0-9a-f]{8}\.io$/)
    })

    it('returns a plaintext sk_live_ key (shown once)', () => {
      expect(body.apiKey.key).toMatch(/^sk_live_/)
    })

    it('creates an auth user with the generated email', async () => {
      const { data: { user } } = await admin.auth.admin.getUserById(body.userId)
      expect(user?.email).toBe(body.email)
    })

    it('creates an accounts row linked to the new auth user', async () => {
      const { data, error } = await admin
        .from('accounts')
        .select('id')
        .eq('user_id', body.userId)
        .single()
      expect(error).toBeNull()
      expect(data!.id).toBe(body.apiKey.account_id)
    })

    it('adds the service account as an org member', async () => {
      const { data, error } = await admin
        .from('organization_members')
        .select('id, invited_by_account_id')
        .eq('organization_id', org.id)
        .eq('account_id', body.apiKey.account_id)
        .single()
      expect(error).toBeNull()
      expect(data!.id).toBeTruthy()
      expect(data!.invited_by_account_id).toBe(owner.accountId)
    })

    it('creates an api_key row linked to the org and service account', async () => {
      const { data, error } = await admin
        .from('api_keys')
        .select('*')
        .eq('id', body.apiKey.id)
        .single()
      expect(error).toBeNull()
      expect(data!.org_id).toBe(org.id)
      expect(data!.account_id).toBe(body.apiKey.account_id)
      expect(data!.name).toBe('my-bot')
      expect(data!.key_prefix).toMatch(/^sk_live_/)
      expect(data!.key_hash).toBeTruthy()
      expect(data!.revoked_at).toBeNull()
    })

    it('does not store the plaintext key in the database', async () => {
      const { data } = await admin
        .from('api_keys')
        .select('key_hash')
        .eq('id', body.apiKey.id)
        .single()
      // The stored hash must differ from the plaintext key
      expect(data!.key_hash).not.toBe(body.apiKey.key)
      // It must be a 64-char hex SHA-256 digest
      expect(data!.key_hash).toMatch(/^[0-9a-f]{64}$/)
    })
  })
})
