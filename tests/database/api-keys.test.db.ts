/**
 * RLS and function tests for the api_keys table and verify_api_key().
 *
 * Policies under test:
 *   - Org members can SELECT, INSERT, UPDATE, DELETE their org's api_keys
 *   - Non-members get empty SELECT, and INSERT/UPDATE/DELETE are blocked
 *
 * Function under test:
 *   - verify_api_key(p_key_hash TEXT) — accessible only by service_role
 *     * Returns key details and bumps last_used_at for a valid, non-revoked,
 *       non-expired key
 *     * Returns empty for a revoked key
 *     * Returns empty for an expired key
 *     * Returns empty for an unknown hash
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  admin,
  addOrgMember,
  createTestOrg,
  createTestUser,
  deleteTestUser,
  sha256,
  uniqueSlug,
  type TestOrg,
  type TestUser,
} from './helpers'
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseApiClient } from '@/lib/supabase/api';
import { API_KEY_CONTEXT_HEADER, ApiKeyContext } from '@/lib/supabase/proxy';
import { NextRequest } from 'next/server';

describe('API Keys RLS and verify_api_key()', () => {
  let orgMember: TestUser
  let orgAdmin: TestUser
  let outsider: TestUser
  let org: TestOrg

  // Track inserted key IDs for cleanup
  const createdKeyIds: number[] = []

  beforeAll(async () => {
    orgMember = await createTestUser('apikey-member')
    orgAdmin  = await createTestUser('apikey-admin')
    outsider  = await createTestUser('apikey-outsider')

    org = await createTestOrg(orgAdmin.accountId, uniqueSlug('apikey-test'))
    await addOrgMember(org.id, orgAdmin.accountId,  'owner')
    await addOrgMember(org.id, orgMember.accountId, 'member')
    // outsider deliberately not added
  })

  afterAll(async () => {
    if (createdKeyIds.length > 0) {
      await admin.from('api_keys').delete().in('id', createdKeyIds)
    }
    await deleteTestUser(orgMember.id)
    await deleteTestUser(orgAdmin.id)
    await deleteTestUser(outsider.id)
  })

  // ─── INSERT ──────────────────────────────────────────────────────────────────

  describe('INSERT', () => {
    it('org member can create an API key', async () => {
      const hash = sha256(`key-member-create-${Date.now()}`)
      const { data, error } = await orgMember.client
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgMember.accountId,
          name:       'Member Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
        })
        .select('id')
        .single()
      expect(error).toBeNull()
      expect(data?.id).toBeTruthy()
      createdKeyIds.push(data!.id)
    })

    it('org admin can create an API key', async () => {
      const hash = sha256(`key-admin-create-${Date.now()}`)
      const { data, error } = await orgAdmin.client
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Admin Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read', 'write'],
        })
        .select('id')
        .single()
      expect(error).toBeNull()
      createdKeyIds.push(data!.id)
    })

    it('outsider cannot create an API key for the org', async () => {
      const hash = sha256(`key-outsider-create-${Date.now()}`)
      const { error } = await outsider.client
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: outsider.accountId,
          name:       'Outsider Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
        })
      expect(error).not.toBeNull()
    })

    it('key_hash must be unique', async () => {
      const hash = sha256(`duplicate-hash-${Date.now()}`)
      const base = {
        org_id:     org.id,
        account_id: orgAdmin.accountId,
        name:       'First',
        key_prefix: hash.slice(0, 12),
        key_hash:   hash,
        scopes:     ['read'],
      }
      const { data } = await admin.from('api_keys').insert(base).select('id').single()
      createdKeyIds.push(data!.id)

      const { error } = await admin
        .from('api_keys')
        .insert({ ...base, name: 'Duplicate' })
      expect(error).not.toBeNull()
    })

    it('name must be between 1 and 100 characters', async () => {
      const hash = sha256(`key-name-too-long-${Date.now()}`)
      const { error } = await admin.from('api_keys').insert({
        org_id:     org.id,
        account_id: orgAdmin.accountId,
        name:       'x'.repeat(101),
        key_prefix: hash.slice(0, 12),
        key_hash:   hash,
        scopes:     ['read'],
      })
      expect(error).not.toBeNull()
    })
  })

  // ─── SELECT ──────────────────────────────────────────────────────────────────

  describe('SELECT', () => {
    let sharedKeyId: number

    beforeAll(async () => {
      const hash = sha256(`key-shared-select-${Date.now()}`)
      const { data } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Shared Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
        })
        .select('id')
        .single()
      sharedKeyId = data!.id
      createdKeyIds.push(sharedKeyId)
    })

    it('org member can read keys for their org', async () => {
      const { data, error } = await orgMember.client
        .from('api_keys')
        .select('id, name')
        .eq('org_id', org.id)
      expect(error).toBeNull()
      expect(data?.some(k => k.id === sharedKeyId)).toBe(true)
    })

    it('outsider gets empty result for org keys', async () => {
      const { data, error } = await outsider.client
        .from('api_keys')
        .select('*')
        .eq('org_id', org.id)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('key_hash is returned in SELECT (only prefix should be shown in UI — business concern, not RLS)', async () => {
      const { data, error } = await orgAdmin.client
        .from('api_keys')
        .select('key_hash, key_prefix')
        .eq('id', sharedKeyId)
        .single()
      expect(error).toBeNull()
      expect(data!.key_hash).toBeTruthy()
      expect(data!.key_prefix).toBeTruthy()
    })
  })

  // ─── UPDATE ──────────────────────────────────────────────────────────────────

  describe('UPDATE — revoke a key', () => {
    let keyId: number

    beforeAll(async () => {
      const hash = sha256(`key-to-revoke-${Date.now()}`)
      const { data } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Key To Revoke',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
        })
        .select('id')
        .single()
      keyId = data!.id
      createdKeyIds.push(keyId)
    })

    it('org member can revoke (update) a key', async () => {
      const revokedAt = new Date().toISOString()
      const { error } = await orgMember.client
        .from('api_keys')
        .update({ revoked_at: revokedAt })
        .eq('id', keyId)
      expect(error).toBeNull()

      const { data } = await admin.from('api_keys').select('revoked_at').eq('id', keyId).single()
      expect(data!.revoked_at).toBeTruthy()
    })

    it('outsider cannot update a key', async () => {
      const { error } = await outsider.client
        .from('api_keys')
        .update({ name: 'Hacked' })
        .eq('id', keyId)
      // PostgREST returns no error but 0 rows updated when RLS blocks without error
      if (!error) {
        const { data } = await admin.from('api_keys').select('name').eq('id', keyId).single()
        expect(data!.name).toBe('Key To Revoke')
      }
    })
  })

  // ─── DELETE ──────────────────────────────────────────────────────────────────

  describe('DELETE', () => {
    it('org member can delete a key', async () => {
      const hash = sha256(`key-to-delete-${Date.now()}`)
      const { data } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Key To Delete',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
        })
        .select('id')
        .single()
      const keyId = data!.id

      const { error } = await orgMember.client
        .from('api_keys')
        .delete()
        .eq('id', keyId)
      expect(error).toBeNull()

      const { data: check } = await admin.from('api_keys').select('id').eq('id', keyId)
      expect(check).toHaveLength(0)
    })

    it('outsider cannot delete a key', async () => {
      const hash = sha256(`key-outsider-delete-${Date.now()}`)
      const { data } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Protected Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
        })
        .select('id')
        .single()
      const keyId = data!.id
      createdKeyIds.push(keyId)

      const { error } = await outsider.client
        .from('api_keys')
        .delete()
        .eq('id', keyId)
      if (!error) {
        const { data: check } = await admin.from('api_keys').select('id').eq('id', keyId)
        expect(check).toHaveLength(1)
      }
    })
  })

  // ─── verify_api_key() ─────────────────────────────────────────────────────────

  describe('verify_api_key()', () => {
    it('valid active key returns key details and updates last_used_at', async () => {
      const rawKey = `valid-key-${Date.now()}`
      const hash   = sha256(rawKey)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: inserted } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Valid Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read', 'write'],
          expires_at: expiresAt,
        })
        .select('id')
        .single()
      createdKeyIds.push(inserted!.id)

      const { data, error } = await admin.rpc('verify_api_key', { p_key_hash: hash })
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].id).toBe(inserted!.id)
      expect(data![0].org_id).toBe(org.id)
      expect(data![0].account_id).toBe(orgAdmin.accountId)
      expect(data![0].scopes).toContain('read')
      expect(data![0].scopes).toContain('write')

      // last_used_at must have been bumped
      const { data: keyRow } = await admin
        .from('api_keys')
        .select('last_used_at')
        .eq('id', inserted!.id)
        .single()
      expect(keyRow!.last_used_at).toBeTruthy()
    })

    it('key without expiry (never expires) is valid', async () => {
      const hash = sha256(`no-expiry-key-${Date.now()}`)
      const { data: inserted } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'No Expiry Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
          // expires_at intentionally omitted
        })
        .select('id')
        .single()
      createdKeyIds.push(inserted!.id)

      const { data, error } = await admin.rpc('verify_api_key', { p_key_hash: hash })
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
    })

    it('revoked key returns empty', async () => {
      const hash = sha256(`revoked-key-${Date.now()}`)
      const { data: inserted } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Revoked Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
          revoked_at: new Date().toISOString(), // already revoked
        })
        .select('id')
        .single()
      createdKeyIds.push(inserted!.id)

      const { data, error } = await admin.rpc('verify_api_key', { p_key_hash: hash })
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('expired key returns empty', async () => {
      const hash = sha256(`expired-key-${Date.now()}`)
      const pastDate = new Date(Date.now() - 1000).toISOString() // 1 second in the past
      const { data: inserted } = await admin
        .from('api_keys')
        .insert({
          org_id:     org.id,
          account_id: orgAdmin.accountId,
          name:       'Expired Key',
          key_prefix: hash.slice(0, 12),
          key_hash:   hash,
          scopes:     ['read'],
          expires_at: pastDate,
        })
        .select('id')
        .single()
      createdKeyIds.push(inserted!.id)

      const { data, error } = await admin.rpc('verify_api_key', { p_key_hash: hash })
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('unknown hash returns empty', async () => {
      const { data, error } = await admin.rpc('verify_api_key', {
        p_key_hash: sha256('this-key-was-never-inserted'),
      })
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('non-service-role client cannot call verify_api_key', async () => {
      const hash = sha256(`member-verify-${Date.now()}`)
      const { error } = await orgMember.client.rpc('verify_api_key', { p_key_hash: hash })
      // REVOKE EXECUTE ... FROM authenticated means authenticated users get a permission error
      expect(error).not.toBeNull()
    })
  })

  // ─── api_scopes table ─────────────────────────────────────────────────────────

  describe('api_scopes', () => {
    it('any authenticated user can read api scopes', async () => {
      const { data, error } = await orgMember.client
        .from('api_scopes')
        .select('key')
      expect(error).toBeNull()
      const keys = data!.map(r => r.key)
      expect(keys).toContain('read')
      expect(keys).toContain('write')
      expect(keys).toContain('qr:read')
      expect(keys).toContain('billing:read')
    })

    it('outsider can also read api scopes (public reference data)', async () => {
      const { data, error } = await outsider.client
        .from('api_scopes')
        .select('key')
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThan(0)
    })
  })
})

describe('API_KEYS', () => {
  const admin = getSupabaseAdminClient();
  let createdUserId: string | undefined;
  let createdOrgId: number | undefined;

  afterAll(async () => {
    // Delete org first (api_keys cascade, but organizations RESTRICT on account deletion)
    if (createdOrgId) {
      await admin.from('organizations').delete().eq('id', createdOrgId);
    }
    // Deleting the auth user cascades to the accounts row
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId);
    }
  });

  it('have their owner\'s access', async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email: 'test1@example.com',
      password: 'password',
      email_confirm: true
    });
    expect(data).toBeTruthy();
    expect(error).toBeNull();
    expect(data?.user).toBeTruthy();
    createdUserId = data?.user?.id;

    const { data: accountsData, error: accountsError } = await admin.from('accounts').select('*').eq('user_id', data?.user!.id).single();
    expect(accountsData).toBeTruthy();
    expect(accountsError).toBeNull();

    const { data: orgData, error: orgError } = await admin.from('organizations').insert({
      owner_account_id: accountsData!.id,
      slug: 'test-org',
    }).select('*').single();
    expect(orgData).toBeTruthy();
    expect(orgError).toBeNull();
    createdOrgId = orgData?.id;

    const { data: apiKeyData, error: apiKeyError } = await admin.from('api_keys').insert({
      org_id: orgData!.id,
      account_id: accountsData!.id,
      name: 'Test API Key',
      scopes: ['read', 'write'],
      created_at: new Date().toISOString(),
      key_hash: '17f165d5a5ba695f27c023a83aa2b3463e23810e360b7517127e90161eebabda', // SHA-256 hash of 'zzz' in HEX
      key_prefix: '17f165d5a5ba',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
    }).select('*').single();
    expect(apiKeyData).toBeTruthy();
    expect(apiKeyError).toBeNull();

    const ctx: ApiKeyContext = {
      keyId: apiKeyData!.id,
      orgId: apiKeyData!.org_id,
      accountId: apiKeyData!.account_id,
      scopes: apiKeyData!.scopes,
      expiresAt: apiKeyData!.expires_at!,
    }
    const request = new NextRequest('http://localhost/api/x', {
      headers: {
        [API_KEY_CONTEXT_HEADER]: JSON.stringify(ctx)
      }
    });

    const apiClient = await getSupabaseApiClient(request);
    const { data: userData, error: userError } = await apiClient.auth.getUser();
    expect(userData).toBeTruthy();
    expect(userError).toBeNull();
    expect(userData?.user).toBeTruthy();
    expect(userData?.user!.email).toBe('test1@example.com');
  });
})