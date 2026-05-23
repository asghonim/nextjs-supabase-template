-- ================================================================
-- RBAC: ROLE-BASED ACCESS CONTROL
--
-- Three-layer permission model:  Platform → Organization → Project
--
-- Design principles:
--   * Permissions are leaf nodes (e.g. "billing.manage")
--   * Roles are bags of permissions — never hardcode role logic
--   * System roles (organization_id / project_id IS NULL) ship out
--     of the box; orgs can add custom roles alongside them
--   * Existing org_member_role enum kept for backward compat;
--     organization_role_id is kept in sync via trigger
--   * Platform admins (platform.admin) bypass all org/project checks
-- ================================================================

CREATE TABLE public.permissions (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         TEXT        NOT NULL UNIQUE,
    name        TEXT        NOT NULL,
    description TEXT,
    scope       TEXT        NOT NULL CHECK (scope IN ('platform', 'organization', 'project', 'api')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_key   ON public.permissions(key);
CREATE INDEX idx_permissions_scope ON public.permissions(scope);

CREATE TABLE public.platform_roles (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         TEXT        NOT NULL UNIQUE,
    name        TEXT        NOT NULL,
    description TEXT,
    is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.platform_role_permissions (
    platform_role_id BIGINT NOT NULL REFERENCES public.platform_roles(id) ON DELETE CASCADE,
    permission_id    BIGINT NOT NULL REFERENCES public.permissions(id)     ON DELETE CASCADE,
    PRIMARY KEY (platform_role_id, permission_id)
);

CREATE INDEX idx_platform_role_perms_role ON public.platform_role_permissions(platform_role_id);

CREATE TABLE public.account_platform_roles (
    account_id            BIGINT      NOT NULL REFERENCES public.accounts(id)       ON DELETE CASCADE,
    platform_role_id      BIGINT      NOT NULL REFERENCES public.platform_roles(id) ON DELETE CASCADE,
    granted_by_account_id BIGINT               REFERENCES public.accounts(id)       ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, platform_role_id)
);

CREATE INDEX idx_account_platform_roles_account ON public.account_platform_roles(account_id);


-- organization_id IS NULL → system role (available to every org).
-- organization_id IS NOT NULL → custom role scoped to that org.
CREATE TABLE public.organization_roles (
    id              BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT               REFERENCES public.organizations(id) ON DELETE CASCADE,
    key             TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    description     TEXT,
    is_system       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_org_role_key_scoped ON public.organization_roles(organization_id, key) WHERE organization_id IS NOT NULL;
CREATE UNIQUE INDEX uq_org_role_key_system ON public.organization_roles(key) WHERE organization_id IS NULL;
CREATE INDEX idx_org_roles_org ON public.organization_roles(organization_id);

CREATE TABLE public.organization_role_permissions (
    organization_role_id BIGINT NOT NULL REFERENCES public.organization_roles(id) ON DELETE CASCADE,
    permission_id        BIGINT NOT NULL REFERENCES public.permissions(id)         ON DELETE CASCADE,
    PRIMARY KEY (organization_role_id, permission_id)
);
CREATE INDEX idx_org_role_perms_role ON public.organization_role_permissions(organization_role_id);

-- ================================================================
-- SEED: PERMISSIONS
-- ================================================================

INSERT INTO public.permissions (key, name, description, scope) VALUES
    -- platform
    ('platform.admin',       'Platform Administrator',   'Full platform access; bypasses all org and project checks', 'platform'),
    ('platform.support',     'Platform Support Access',  'Read-only support access across all resources',             'platform'),
    -- organization
    ('organization.manage',  'Manage Organization',      'Update org settings, slug, and metadata',                   'organization'),
    ('users.invite',         'Invite Users',             'Send org membership invitations',                           'organization'),
    ('billing.manage',       'Manage Billing',           'View and update billing, plans, and invoices',              'organization'),
    ('analytics.view',       'View Analytics',           'Access analytics and usage dashboards',                     'organization'),
    ('audit.view',           'View Audit Logs',          'Read audit trails and access logs',                         'organization'),
    ('security.review',      'Security Review',          'Review security settings and security events',              'organization'),
    -- project
    ('qr.view',              'View QR Codes',            'Read QR code resources',                                    'project'),
    ('qr.create',            'Create QR Codes',          'Create new QR code resources',                              'project'),
    ('qr.update',            'Update QR Codes',          'Modify existing QR code resources',                         'project'),
    ('qr.delete',            'Delete QR Codes',          'Delete QR code resources',                                  'project'),
    ('apikey.create',        'Create API Keys',          'Generate new API keys for programmatic access',             'project'),
    ('webhooks.manage',      'Manage Webhooks',          'Configure and manage webhook endpoints',                    'project'),
    -- api
    ('api:read',             'API Read',                 'Read-only access via API key',                              'api'),
    ('api:write',            'API Write',                'Read and write access via API key',                         'api');


-- ================================================================
-- SEED: PLATFORM ROLES
-- ================================================================

INSERT INTO public.platform_roles (key, name, description, is_system) VALUES
    ('super_admin', 'Super Administrator', 'Unrestricted access to all platform resources', TRUE),
    ('support',     'Support Agent',       'Read-only cross-org support access',             TRUE),
    ('auditor',     'Auditor',             'Compliance and security audit access',            TRUE);

-- super_admin → every permission
INSERT INTO public.platform_role_permissions (platform_role_id, permission_id)
SELECT pr.id, p.id
FROM public.platform_roles pr, public.permissions p
WHERE pr.key = 'super_admin';

-- support
INSERT INTO public.platform_role_permissions (platform_role_id, permission_id)
SELECT pr.id, p.id
FROM public.platform_roles pr
JOIN public.permissions p ON p.key IN ('platform.support', 'analytics.view', 'audit.view')
WHERE pr.key = 'support';

-- auditor
INSERT INTO public.platform_role_permissions (platform_role_id, permission_id)
SELECT pr.id, p.id
FROM public.platform_roles pr
JOIN public.permissions p ON p.key IN ('audit.view', 'security.review')
WHERE pr.key = 'auditor';


-- ================================================================
-- SEED: ORGANIZATION ROLES (system)
-- ================================================================

INSERT INTO public.organization_roles (organization_id, key, name, description, is_system) VALUES
    (NULL, 'owner',   'Owner',           'Full organizational control; cannot be removed without transferring ownership', TRUE),
    (NULL, 'admin',   'Administrator',   'Manage members, settings, and billing',                                         TRUE),
    (NULL, 'member',  'Member',          'Standard team member access',                                                   TRUE),
    (NULL, 'billing', 'Billing Manager', 'Billing and invoice access only',                                               TRUE);

-- owner → everything
INSERT INTO public.organization_role_permissions (organization_role_id, permission_id)
SELECT r.id, p.id
FROM public.organization_roles r
JOIN public.permissions p ON p.key IN (
    'organization.manage', 'users.invite', 'billing.manage',
    'analytics.view', 'audit.view', 'security.review'
)
WHERE r.key = 'owner' AND r.organization_id IS NULL;

-- admin
INSERT INTO public.organization_role_permissions (organization_role_id, permission_id)
SELECT r.id, p.id
FROM public.organization_roles r
JOIN public.permissions p ON p.key IN (
    'organization.manage', 'users.invite', 'billing.manage', 'analytics.view'
)
WHERE r.key = 'admin' AND r.organization_id IS NULL;

-- member
INSERT INTO public.organization_role_permissions (organization_role_id, permission_id)
SELECT r.id, p.id
FROM public.organization_roles r
JOIN public.permissions p ON p.key IN ('analytics.view')
WHERE r.key = 'member' AND r.organization_id IS NULL;

-- billing
INSERT INTO public.organization_role_permissions (organization_role_id, permission_id)
SELECT r.id, p.id
FROM public.organization_roles r
JOIN public.permissions p ON p.key IN ('billing.manage')
WHERE r.key = 'billing' AND r.organization_id IS NULL;