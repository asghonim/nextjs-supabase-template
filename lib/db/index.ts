import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createAccountsDb } from './accounts'
import { createOrganizationsDb } from './organizations'
import { createPlansDb } from './plans'
import { createAddonsDb } from './addons'
import { createSubscriptionsDb } from './subscriptions'
import { createEntitlementsDb } from './entitlements'
import { createBillingDb } from './billing'
import { createUsageDb } from './usage'
import { createNotificationsDb } from './notifications'
import { createContactDb } from './contact'
import { createRbacDb } from './rbac'
import { createApiKeysDb } from './api-keys'

export function createDb(supabase: SupabaseClient<Database>) {
  return {
    accounts: createAccountsDb(supabase),
    organizations: createOrganizationsDb(supabase),
    plans: createPlansDb(supabase),
    addons: createAddonsDb(supabase),
    subscriptions: createSubscriptionsDb(supabase),
    entitlements: createEntitlementsDb(supabase),
    billing: createBillingDb(supabase),
    usage: createUsageDb(supabase),
    notifications: createNotificationsDb(supabase),
    contact: createContactDb(supabase),
    rbac: createRbacDb(supabase),
    apiKeys: createApiKeysDb(supabase),
  }
}

export type Db = ReturnType<typeof createDb>

export type { AccountsDb } from './accounts'
export type { OrganizationsDb } from './organizations'
export type { PlansDb } from './plans'
export type { AddonsDb } from './addons'
export type { SubscriptionsDb } from './subscriptions'
export type { EntitlementsDb } from './entitlements'
export type { BillingDb } from './billing'
export type { UsageDb } from './usage'
export type { NotificationsDb } from './notifications'
export type { ContactDb } from './contact'
export type { RbacDb } from './rbac'
export type { ApiKeysDb } from './api-keys'
