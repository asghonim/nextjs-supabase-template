/**
 * RLS tests for organizations, organization_members, organization_names,
 * and the permission helper functions (get_my_org_permissions).
 *
 * Policies under test:
 *   - Only org members can SELECT from organizations
 *   - Only org members can SELECT from organization_members
 *   - Only org admins (organization.manage permission) can INSERT/UPDATE/DELETE members
 *   - get_my_org_permissions() returns the correct permission set per role
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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

describe('Organizations & Membership RLS', () => {
  let owner: TestUser
  let adminUser: TestUser
  let member: TestUser
  let billingUser: TestUser
  let outsider: TestUser
  let org: TestOrg

  beforeAll(async () => {
    owner       = await createTestUser('org-owner')
    adminUser   = await createTestUser('org-admin')
    member      = await createTestUser('org-member')
    billingUser = await createTestUser('org-billing')
    outsider    = await createTestUser('org-outsider')

    org = await createTestOrg(owner.accountId, uniqueSlug('orgs-rls-test'))

    await addOrgMember(org.id, owner.accountId,       'owner')
    await addOrgMember(org.id, adminUser.accountId,   'admin')
    await addOrgMember(org.id, member.accountId,      'member')
    await addOrgMember(org.id, billingUser.accountId, 'billing')
    // outsider is deliberately not added
  })

  afterAll(async () => {
    await deleteTestUser(owner.id)
    await deleteTestUser(adminUser.id)
    await deleteTestUser(member.id)
    await deleteTestUser(billingUser.id)
    await deleteTestUser(outsider.id)
  })

  // ─── organizations table ─────────────────────────────────────────────────────

  describe('organizations — SELECT', () => {
    it('owner can read the org', async () => {
      const { data, error } = await owner.client
        .from('organizations')
        .select('id, slug')
        .eq('id', org.id)
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].slug).toBe(org.slug)
    })

    it('regular member can read the org', async () => {
      const { data, error } = await member.client
        .from('organizations')
        .select('id')
        .eq('id', org.id)
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
    })

    it('outsider gets empty result (not an error)', async () => {
      const { data, error } = await outsider.client
        .from('organizations')
        .select('id')
        .eq('id', org.id)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('outsider cannot enumerate all orgs', async () => {
      const { data, error } = await outsider.client
        .from('organizations')
        .select('id')
      expect(error).toBeNull()
      const ids = data?.map(r => r.id) ?? []
      expect(ids).not.toContain(org.id)
    })
  })

  // ─── organization_members table ───────────────────────────────────────────────

  describe('organization_members — SELECT', () => {
    it('owner can read the member roster', async () => {
      const { data, error } = await owner.client
        .from('organization_members')
        .select('account_id')
        .eq('organization_id', org.id)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(4) // owner + admin + member + billing
    })

    it('regular member can read the member roster', async () => {
      const { data, error } = await member.client
        .from('organization_members')
        .select('account_id')
        .eq('organization_id', org.id)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(4)
    })

    it('outsider gets empty roster', async () => {
      const { data, error } = await outsider.client
        .from('organization_members')
        .select('*')
        .eq('organization_id', org.id)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })
  })

  describe('organization_members — INSERT (admin gate)', () => {
    it('org admin can add a new member', async () => {
      const newUser = await createTestUser('new-member-via-admin')
      const { data: role } = await admin
        .from('organization_roles')
        .select('id')
        .eq('key', 'member')
        .is('organization_id', null)
        .single()

      const { error } = await adminUser.client
        .from('organization_members')
        .insert({
          organization_id: org.id,
          account_id: newUser.accountId,
          organization_role_id: role!.id,
        })
      expect(error).toBeNull()

      // Cleanup
      await admin
        .from('organization_members')
        .delete()
        .eq('organization_id', org.id)
        .eq('account_id', newUser.accountId)
      await deleteTestUser(newUser.id)
    })

    it('regular member cannot add a new member', async () => {
      const newUser = await createTestUser('new-member-via-member')
      const { data: role } = await admin
        .from('organization_roles')
        .select('id')
        .eq('key', 'member')
        .is('organization_id', null)
        .single()

      const { error } = await member.client
        .from('organization_members')
        .insert({
          organization_id: org.id,
          account_id: newUser.accountId,
          organization_role_id: role!.id,
        })
      expect(error).not.toBeNull() // RLS violation

      await deleteTestUser(newUser.id)
    })

    it('outsider cannot add a member', async () => {
      const newUser = await createTestUser('new-member-via-outsider')
      const { data: role } = await admin
        .from('organization_roles')
        .select('id')
        .eq('key', 'member')
        .is('organization_id', null)
        .single()

      const { error } = await outsider.client
        .from('organization_members')
        .insert({
          organization_id: org.id,
          account_id: newUser.accountId,
          organization_role_id: role!.id,
        })
      expect(error).not.toBeNull()

      await deleteTestUser(newUser.id)
    })
  })

  describe('organization_members — DELETE (admin gate)', () => {
    it('org admin can remove a member', async () => {
      const tempUser = await createTestUser('temp-for-removal')
      await addOrgMember(org.id, tempUser.accountId, 'member')

      const { error } = await adminUser.client
        .from('organization_members')
        .delete()
        .eq('organization_id', org.id)
        .eq('account_id', tempUser.accountId)
      expect(error).toBeNull()

      await deleteTestUser(tempUser.id)
    })

    it('regular member cannot remove another member', async () => {
      const tempUser = await createTestUser('temp-for-no-removal')
      await addOrgMember(org.id, tempUser.accountId, 'member')

      const { error } = await member.client
        .from('organization_members')
        .delete()
        .eq('organization_id', org.id)
        .eq('account_id', tempUser.accountId)
      // RLS blocks DELETE for non-admins — either error or 0 rows affected
      if (!error) {
        // Confirm the row still exists
        const { data } = await admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', org.id)
          .eq('account_id', tempUser.accountId)
        expect(data).toHaveLength(1)
      } else {
        expect(error).not.toBeNull()
      }

      await admin
        .from('organization_members')
        .delete()
        .eq('organization_id', org.id)
        .eq('account_id', tempUser.accountId)
      await deleteTestUser(tempUser.id)
    })
  })

  // ─── organization_names table ─────────────────────────────────────────────────

  describe('organization_names — INSERT (admin gate)', () => {
    it('org admin can insert an org name', async () => {
      const { error } = await owner.client
        .from('organization_names')
        .insert({ organization_id: org.id, name: 'Test Org Inc.' })
      expect(error).toBeNull()
    })

    it('regular member cannot insert an org name', async () => {
      const { error } = await member.client
        .from('organization_names')
        .insert({ organization_id: org.id, name: 'Hijack Name' })
      expect(error).not.toBeNull()
    })

    it('outsider cannot insert an org name', async () => {
      const { error } = await outsider.client
        .from('organization_names')
        .insert({ organization_id: org.id, name: 'Outsider Name' })
      expect(error).not.toBeNull()
    })
  })

  // ─── get_my_org_permissions() ─────────────────────────────────────────────────

  describe('get_my_org_permissions()', () => {
    it('owner gets all org permissions', async () => {
      const { data, error } = await owner.client.rpc('get_my_org_permissions', {
        p_org_id: org.id,
      })
      expect(error).toBeNull()
      const perms = data as string[]
      expect(perms).toContain('organization.manage')
      expect(perms).toContain('billing.manage')
      expect(perms).toContain('users.invite')
      expect(perms).toContain('analytics.view')
      expect(perms).toContain('audit.view')
      expect(perms).toContain('security.review')
    })

    it('admin gets manage/invite/billing/analytics', async () => {
      const { data, error } = await adminUser.client.rpc('get_my_org_permissions', {
        p_org_id: org.id,
      })
      expect(error).toBeNull()
      const perms = data as string[]
      expect(perms).toContain('organization.manage')
      expect(perms).toContain('users.invite')
      expect(perms).toContain('billing.manage')
      expect(perms).toContain('analytics.view')
      expect(perms).not.toContain('audit.view')
      expect(perms).not.toContain('security.review')
    })

    it('member only gets analytics.view', async () => {
      const { data, error } = await member.client.rpc('get_my_org_permissions', {
        p_org_id: org.id,
      })
      expect(error).toBeNull()
      const perms = data as string[]
      expect(perms).toContain('analytics.view')
      expect(perms).not.toContain('organization.manage')
      expect(perms).not.toContain('billing.manage')
      expect(perms).not.toContain('users.invite')
    })

    it('billing role gets billing.manage only', async () => {
      const { data, error } = await billingUser.client.rpc('get_my_org_permissions', {
        p_org_id: org.id,
      })
      expect(error).toBeNull()
      const perms = data as string[]
      expect(perms).toContain('billing.manage')
      expect(perms).not.toContain('organization.manage')
      expect(perms).not.toContain('users.invite')
    })

    it('outsider gets empty permissions array', async () => {
      const { data, error } = await outsider.client.rpc('get_my_org_permissions', {
        p_org_id: org.id,
      })
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })
  })
})
