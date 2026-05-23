/**
 * RLS tests for the RBAC tables and helper functions.
 *
 * Tables under test:
 *   - permissions            (authenticated users can SELECT)
 *   - platform_roles         (authenticated users can SELECT)
 *   - platform_role_permissions (authenticated users can SELECT)
 *   - account_platform_roles (users see their own; platform admins see all)
 *   - organization_roles     (system roles visible to all authenticated; custom roles to org members)
 *   - organization_role_permissions (authenticated users can SELECT)
 *
 * Functions under test:
 *   - get_my_platform_permissions()
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  admin,
  addOrgMember,
  createTestOrg,
  createTestUser,
  deleteTestUser,
  grantPlatformRole,
  uniqueSlug,
  type TestOrg,
  type TestUser,
} from './helpers'

describe('RBAC tables and platform permission functions', () => {
  let regularUser: TestUser
  let platformAdmin: TestUser
  let orgOwner: TestUser
  let orgMember: TestUser
  let org: TestOrg

  beforeAll(async () => {
    regularUser  = await createTestUser('rbac-regular')
    platformAdmin = await createTestUser('rbac-platform-admin')
    orgOwner     = await createTestUser('rbac-org-owner')
    orgMember    = await createTestUser('rbac-org-member')

    org = await createTestOrg(orgOwner.accountId, uniqueSlug('rbac-test'))
    await addOrgMember(org.id, orgOwner.accountId,  'owner')
    await addOrgMember(org.id, orgMember.accountId, 'member')

    await grantPlatformRole(platformAdmin.accountId, 'super_admin')
  })

  afterAll(async () => {
    await deleteTestUser(regularUser.id)
    await deleteTestUser(platformAdmin.id)
    await deleteTestUser(orgOwner.id)
    await deleteTestUser(orgMember.id)
  })

  // ─── permissions table ────────────────────────────────────────────────────────

  describe('permissions table', () => {
    it('any authenticated user can read all permissions', async () => {
      const { data, error } = await regularUser.client
        .from('permissions')
        .select('key')
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThan(0)
      const keys = data!.map(r => r.key)
      expect(keys).toContain('platform.admin')
      expect(keys).toContain('organization.manage')
      expect(keys).toContain('billing.manage')
    })

    it('contains all expected scopes', async () => {
      const { data, error } = await regularUser.client
        .from('permissions')
        .select('scope')
      expect(error).toBeNull()
      const scopes = [...new Set(data!.map(r => r.scope))]
      expect(scopes).toContain('platform')
      expect(scopes).toContain('organization')
      expect(scopes).toContain('project')
      expect(scopes).toContain('api')
    })
  })

  // ─── platform_roles table ─────────────────────────────────────────────────────

  describe('platform_roles table', () => {
    it('any authenticated user can read platform roles', async () => {
      const { data, error } = await regularUser.client
        .from('platform_roles')
        .select('key')
      expect(error).toBeNull()
      const keys = data!.map(r => r.key)
      expect(keys).toContain('super_admin')
      expect(keys).toContain('support')
      expect(keys).toContain('auditor')
    })
  })

  // ─── organization_roles table ─────────────────────────────────────────────────

  describe('organization_roles — system roles', () => {
    it('any authenticated user can read system roles (organization_id IS NULL)', async () => {
      const { data, error } = await regularUser.client
        .from('organization_roles')
        .select('key')
        .is('organization_id', null)
      expect(error).toBeNull()
      const keys = data!.map(r => r.key)
      expect(keys).toContain('owner')
      expect(keys).toContain('admin')
      expect(keys).toContain('member')
      expect(keys).toContain('billing')
    })

    it('org member can read system roles', async () => {
      const { data, error } = await orgMember.client
        .from('organization_roles')
        .select('key')
        .is('organization_id', null)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('organization_roles — custom roles', () => {
    let customRoleId: number

    beforeAll(async () => {
      // Create a custom role via admin (simulating an org admin action)
      const { data, error } = await admin
        .from('organization_roles')
        .insert({
          organization_id: org.id,
          key: 'custom_viewer',
          name: 'Custom Viewer',
          is_system: false,
        })
        .select('id')
        .single()
      if (error) throw new Error(`create custom role: ${error.message}`)
      customRoleId = data!.id
    })

    afterAll(async () => {
      await admin.from('organization_roles').delete().eq('id', customRoleId)
    })

    it('org member can read custom roles for their org', async () => {
      const { data, error } = await orgMember.client
        .from('organization_roles')
        .select('key')
        .eq('organization_id', org.id)
      expect(error).toBeNull()
      expect(data?.some(r => r.key === 'custom_viewer')).toBe(true)
    })

    it('org admin (owner) can create a custom role', async () => {
      const { data, error } = await orgOwner.client
        .from('organization_roles')
        .insert({
          organization_id: org.id,
          key: 'owner_created_role',
          name: 'Owner Created Role',
          is_system: false,
        })
        .select('id')
        .single()
      expect(error).toBeNull()
      // Cleanup
      await admin.from('organization_roles').delete().eq('id', data!.id)
    })

    it('regular member cannot create a custom role', async () => {
      const { error } = await orgMember.client
        .from('organization_roles')
        .insert({
          organization_id: org.id,
          key: 'member_attempt',
          name: 'Should Fail',
          is_system: false,
        })
      expect(error).not.toBeNull()
    })

    it('outsider cannot read custom roles of an org they don\'t belong to', async () => {
      const { data, error } = await regularUser.client
        .from('organization_roles')
        .select('key')
        .eq('organization_id', org.id)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })
  })

  // ─── account_platform_roles table ────────────────────────────────────────────

  describe('account_platform_roles', () => {
    it('user can read their own platform roles', async () => {
      const { data, error } = await platformAdmin.client
        .from('account_platform_roles')
        .select('platform_role_id')
        .eq('account_id', platformAdmin.accountId)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(1)
    })

    it('regular user sees empty set for their own account (no platform roles)', async () => {
      const { data, error } = await regularUser.client
        .from('account_platform_roles')
        .select('*')
        .eq('account_id', regularUser.accountId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('regular user cannot see another account\'s platform roles', async () => {
      const { data, error } = await regularUser.client
        .from('account_platform_roles')
        .select('*')
        .eq('account_id', platformAdmin.accountId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })
  })

  // ─── get_my_platform_permissions() ────────────────────────────────────────────

  describe('get_my_platform_permissions()', () => {
    it('regular user gets empty platform permissions', async () => {
      const { data, error } = await regularUser.client.rpc('get_my_platform_permissions')
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('super_admin gets all platform permissions', async () => {
      const { data, error } = await platformAdmin.client.rpc('get_my_platform_permissions')
      expect(error).toBeNull()
      const perms = data as string[]
      expect(perms).toContain('platform.admin')
      expect(perms).toContain('platform.support')
      expect(perms).toContain('billing.manage')
      expect(perms).toContain('organization.manage')
    })

    it('get_my_org_permissions returns empty for platform admin without org membership', async () => {
      // get_my_org_permissions() queries organization_members directly, so a platform admin
      // who is not a member of the org gets an empty array — the is_platform_admin() bypass
      // lives in has_org_permission() (used by RLS policies), not in this public function.
      const { data, error } = await platformAdmin.client.rpc('get_my_org_permissions', {
        p_org_id: org.id,
      })
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('platform admin bypass: can manage org members for any org via is_org_admin RLS bypass', async () => {
      // is_org_admin(org_id) → has_org_permission(org_id, 'organization.manage')
      //   → is_platform_admin() OR membership check
      // So a platform admin can INSERT into organization_members for any org without being a member.
      const tempUser = await createTestUser('plat-admin-bypass')
      const { data: role } = await admin
        .from('organization_roles')
        .select('id')
        .eq('key', 'member')
        .is('organization_id', null)
        .single()

      const { error } = await platformAdmin.client
        .from('organization_members')
        .insert({
          organization_id: org.id,
          account_id: tempUser.accountId,
          organization_role_id: role!.id,
        })
      expect(error).toBeNull()

      await admin
        .from('organization_members')
        .delete()
        .eq('organization_id', org.id)
        .eq('account_id', tempUser.accountId)
      await deleteTestUser(tempUser.id)
    })
  })

  // ─── organization_role_permissions table ──────────────────────────────────────

  describe('organization_role_permissions', () => {
    it('any authenticated user can read role-permission mappings', async () => {
      const { data, error } = await regularUser.client
        .from('organization_role_permissions')
        .select('organization_role_id, permission_id')
        .limit(5)
      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThan(0)
    })
  })
})
