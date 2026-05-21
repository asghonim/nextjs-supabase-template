import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type OrgInsert = Database['public']['Tables']['organizations']['Insert']
type OrgUpdate = Database['public']['Tables']['organizations']['Update']
type MemberRole = Database['public']['Enums']['org_member_role']

export function createOrganizationsDb(supabase: SupabaseClient<Database>) {
  return {
    getById(id: number) {
      return supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()
    },

    getBySlug(slug: string) {
      return supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()
    },

    /** All orgs the given account belongs to (any role). */
    listByAccountId(accountId: number) {
      return supabase
        .from('organizations')
        .select('*, organization_members!inner(role)')
        .eq('organization_members.account_id', accountId)
    },

    create(data: OrgInsert) {
      return supabase
        .from('organizations')
        .insert(data)
        .select()
        .single()
    },

    update(id: number, data: OrgUpdate) {
      return supabase
        .from('organizations')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    },

    // ── Members ─────────────────────────────────────────────────────

    listMembers(orgId: number) {
      return supabase
        .from('organization_members')
        .select('*, accounts(*)')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true })
    },

    getMember(orgId: number, accountId: number) {
      return supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('account_id', accountId)
        .single()
    },

    addMember(
      orgId: number,
      accountId: number,
      role: MemberRole = 'member',
      invitedByAccountId?: number,
    ) {
      return supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          account_id: accountId,
          role,
          invited_by_account_id: invitedByAccountId ?? null,
        })
        .select()
        .single()
    },

    updateMemberRole(memberId: number, role: MemberRole) {
      return supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single()
    },

    removeMember(memberId: number) {
      return supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
    },
  }
}

export type OrganizationsDb = ReturnType<typeof createOrganizationsDb>
