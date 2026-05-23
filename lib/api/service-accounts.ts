import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createRbacDb } from '@/lib/db/rbac'
import { createOrganizationsDb } from '@/lib/db/organizations'
import { createApiKeysDb } from '@/lib/db/api-keys'
import { generateApiKey } from '@/lib/api-keys'

// ── e.g. POST /api/service-accounts ────────────────────────────────────────────────
//
// Creates a new service account:
//   1. Verifies the caller is authenticated and has organization.manage on the org
//   2. Generates a unique email (<username>@service.qrserver-<8hex>.io) and a
//      random password — neither is stored anywhere
//   3. Creates a Supabase auth user via the admin API (auto-confirmed)
//   4. Creates a corresponding `accounts` row for the new auth user (via trigger)
//   5. Adds the service account as a member of the org
//   6. Creates an api_key scoped to the org and owned by the new service account
//
// The random domain and random password ensure no human can ever sign in as
// this account, while still giving it a real auth identity for observability.

const SERVICE_ACCOUNT_USERNAME_RE = /^[a-z0-9][a-z0-9_-]{0,48}[a-z0-9]$/i;
const generateServiceAccountCredentials = (username: string) => {
  const randomHex = crypto.getRandomValues(new Uint8Array(4)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
  return {
    email: `${username}@service.qrserver-${randomHex}.io`,
    password: crypto.getRandomValues(new Uint8Array(16)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), ''),
  }
};

export async function postServiceAccount(request: NextRequest) {
  // ── 1. Authenticate caller ──────────────────────────────────────
  const serverClient = await createClient()
  const {
    data: { user },
    error: authError,
  } = await serverClient.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse & validate body ────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { orgId, username } = body as { orgId?: unknown; username?: unknown }

  if (typeof orgId !== 'number' || !Number.isInteger(orgId) || orgId < 1) {
    return NextResponse.json({ error: 'orgId must be a positive integer' }, { status: 400 })
  }

  if (typeof username !== 'string' || !SERVICE_ACCOUNT_USERNAME_RE.test(username)) {
    return NextResponse.json(
      {
        error:
          'username must be 1–50 characters, start with a letter or digit, and contain only a–z, 0–9, hyphens, and underscores',
      },
      { status: 400 },
    )
  }

  // ── 3. Resolve caller's account (admin bypasses RLS — accounts has no SELECT policy) ──
  const admin = getSupabaseAdminClient()
  const { data: callerAccount, error: callerError } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (callerError || !callerAccount) {
    return NextResponse.json({ error: 'Caller account not found' }, { status: 404 })
  }

  // ── 4. Verify org permission ─────────────────────────────────────
  const rbac = createRbacDb(serverClient)
  const { data: permissions, error: permError } = await rbac.getMyOrgPermissions(orgId)

  if (permError) {
    return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 })
  }

  if (!permissions?.includes('organization.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── 5. Generate credentials ──────────────────────────────────────
  const { email, password } = generateServiceAccountCredentials(username)

  // ── 6. Create auth user (admin) ──────────────────────────────────
  const { data: authData, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createUserError || !authData.user) {
    console.error('[service-accounts] createUser error', createUserError)
    return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
  }

  const newAuthUserId = authData.user.id

  // ── 7. Resolve the service account's accounts row (created by trigger) ──
  const { data: serviceAccount, error: saError } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', newAuthUserId)
    .single()

  if (saError || !serviceAccount) {
    console.error('[service-accounts] accounts lookup error', saError)
    return NextResponse.json({ error: 'Service account record not found' }, { status: 500 })
  }

  // ── 8. Add service account to org members ───────────────────────────────
  const orgsDb = createOrganizationsDb(admin)
  const { error: addMemberError } = await orgsDb.addMember(orgId, serviceAccount.id, undefined, callerAccount.id)

  if (addMemberError) {
    console.error('[service-accounts] addMember error', addMemberError)
    return NextResponse.json({ error: 'Failed to add service account to org' }, { status: 500 })
  }

  // ── 9. Generate & store the API key ─────────────────────────────────────
  const { key, hash, prefix } = generateApiKey()
  const apiKeysDb = createApiKeysDb(admin)

  const { data: apiKey, error: apiKeyError } = await apiKeysDb.create({
    org_id: orgId,
    account_id: serviceAccount.id,
    name: username,
    key_prefix: prefix,
    key_hash: hash,
    scopes: [],
  })

  if (apiKeyError || !apiKey) {
    console.error('[service-accounts] api_key create error', apiKeyError)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }

  return NextResponse.json({ email, userId: newAuthUserId, apiKey: { ...apiKey, key } }, { status: 201 })
}
