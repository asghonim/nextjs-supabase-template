export const PERMISSIONS = {
  // ── Platform ─────────────────────────────────────────────────
  PLATFORM_ADMIN:       'platform.admin',
  PLATFORM_SUPPORT:     'platform.support',

  // ── Organization ─────────────────────────────────────────────
  ORGANIZATION_MANAGE:  'organization.manage',
  USERS_INVITE:         'users.invite',
  BILLING_MANAGE:       'billing.manage',
  ANALYTICS_VIEW:       'analytics.view',
  AUDIT_VIEW:           'audit.view',
  SECURITY_REVIEW:      'security.review',

  // ── Project ──────────────────────────────────────────────────
  QR_VIEW:              'qr.view',
  QR_CREATE:            'qr.create',
  QR_UPDATE:            'qr.update',
  QR_DELETE:            'qr.delete',
  APIKEY_CREATE:        'apikey.create',
  WEBHOOKS_MANAGE:      'webhooks.manage',

  // ── API ──────────────────────────────────────────────────────
  API_READ:             'api:read',
  API_WRITE:            'api:write',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const PLATFORM_ROLE_KEYS = {
  SUPER_ADMIN: 'super_admin',
  SUPPORT:     'support',
  AUDITOR:     'auditor',
} as const

export type PlatformRoleKey = typeof PLATFORM_ROLE_KEYS[keyof typeof PLATFORM_ROLE_KEYS]

export const ORG_ROLE_KEYS = {
  OWNER:   'owner',
  ADMIN:   'admin',
  MEMBER:  'member',
  BILLING: 'billing',
} as const

export type OrgRoleKey = typeof ORG_ROLE_KEYS[keyof typeof ORG_ROLE_KEYS]

export const PROJECT_ROLE_KEYS = {
  OWNER:     'owner',
  DEVELOPER: 'developer',
  VIEWER:    'viewer',
} as const

export type ProjectRoleKey = typeof PROJECT_ROLE_KEYS[keyof typeof PROJECT_ROLE_KEYS]
