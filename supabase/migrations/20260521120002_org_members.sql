CREATE TABLE public.organization_members (
    id                 BIGINT                 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id    BIGINT                 NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_id            BIGINT                 NOT NULL REFERENCES public.accounts(id)        ON DELETE CASCADE,
    organization_role_id               BIGINT REFERENCES public.organization_roles(id) ON DELETE RESTRICT,
    invited_by_account_id BIGINT                 REFERENCES public.accounts(id) ON DELETE SET NULL,
    joined_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    created_at         TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, account_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_members_account ON public.organization_members(account_id);
CREATE INDEX idx_org_members_org  ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_org_role ON public.organization_members(organization_role_id);
CREATE OR REPLACE FUNCTION private.on_insert_organization_members() RETURNS TRIGGER AS $$ BEGIN NEW.created_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_organization_members_inserted BEFORE INSERT ON public.organization_members FOR EACH ROW EXECUTE FUNCTION private.on_insert_organization_members();


CREATE OR REPLACE FUNCTION private.is_org_member(p_org_id BIGINT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.accounts a ON a.id = om.account_id
        WHERE om.organization_id = p_org_id
          AND a.user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Allow members to view their organization"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (private.is_org_member(id));

CREATE POLICY "Allow members to view org roster"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (private.is_org_member(organization_id));


-- Returns true if the calling user holds the named platform permission.
CREATE OR REPLACE FUNCTION private.has_platform_permission(p_permission_key TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.account_platform_roles   apr
        JOIN public.platform_role_permissions prp ON prp.platform_role_id = apr.platform_role_id
        JOIN public.permissions              p   ON p.id  = prp.permission_id
        JOIN public.accounts                 a   ON a.id  = apr.account_id
        WHERE a.user_id = auth.uid()
          AND p.key     = p_permission_key
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT private.has_platform_permission('platform.admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION private.has_org_permission(p_org_id BIGINT, p_permission_key TEXT)
RETURNS BOOLEAN AS $$
    SELECT
        private.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.organization_members         om
            JOIN public.organization_role_permissions orp ON orp.organization_role_id = om.organization_role_id
            JOIN public.permissions                  p   ON p.id  = orp.permission_id
            JOIN public.accounts                     a   ON a.id  = om.account_id
            WHERE om.organization_id = p_org_id
              AND a.user_id          = auth.uid()
              AND p.key              = p_permission_key
        );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


CREATE OR REPLACE FUNCTION private.is_org_admin(p_org_id BIGINT)
RETURNS BOOLEAN AS $$
    SELECT private.has_org_permission(p_org_id, 'organization.manage');
$$ LANGUAGE sql SECURITY DEFINER STABLE;


CREATE POLICY "Allow admins to manage org membership"
    ON public.organization_members FOR ALL
    TO authenticated
    USING (private.is_org_admin(organization_id));

CREATE POLICY "Allow owner to insert organization name"
    ON public.organization_names FOR INSERT
    TO authenticated
    WITH CHECK (exists(SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND private.is_org_admin(o.id)));

CREATE POLICY "Allow owner to insert billing emails"
    ON public.organization_billing_emails FOR INSERT
    TO authenticated
    WITH CHECK (exists(SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND private.is_org_admin(o.id)));


CREATE OR REPLACE FUNCTION private.is_org_billing(p_org_id BIGINT)
RETURNS BOOLEAN AS $$
    SELECT private.has_org_permission(p_org_id, 'billing.manage');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_platform_permissions()
RETURNS TEXT[] AS $$
    SELECT COALESCE(ARRAY_AGG(DISTINCT p.key), '{}')
    FROM public.account_platform_roles    apr
    JOIN public.platform_role_permissions prp ON prp.platform_role_id = apr.platform_role_id
    JOIN public.permissions               p   ON p.id = prp.permission_id
    JOIN public.accounts                  a   ON a.id = apr.account_id
    WHERE a.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_org_permissions(p_org_id BIGINT)
RETURNS TEXT[] AS $$
    SELECT COALESCE(ARRAY_AGG(DISTINCT p.key), '{}')
    FROM public.organization_members         om
    JOIN public.organization_role_permissions orp ON orp.organization_role_id = om.organization_role_id
    JOIN public.permissions                  p   ON p.id = orp.permission_id
    JOIN public.accounts                     a   ON a.id = om.account_id
    WHERE om.organization_id = p_org_id
      AND a.user_id          = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view permissions"
    ON public.permissions FOR SELECT TO authenticated USING (TRUE);

ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view platform roles"
    ON public.platform_roles FOR SELECT TO authenticated USING (TRUE);

ALTER TABLE public.platform_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view platform role permissions"
    ON public.platform_role_permissions FOR SELECT TO authenticated USING (TRUE);

ALTER TABLE public.account_platform_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own platform roles"
    ON public.account_platform_roles FOR SELECT TO authenticated
    USING (
        private.is_platform_admin()
        OR account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    );
CREATE POLICY "Platform admins can manage account platform roles"
    ON public.account_platform_roles FOR ALL TO authenticated
    USING (private.is_platform_admin())
    WITH CHECK (private.is_platform_admin());

ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view their organization roles"
    ON public.organization_roles FOR SELECT TO authenticated
    USING (
        organization_id IS NULL
        OR private.is_org_member(organization_id)
    );
CREATE POLICY "Org admins can manage custom roles"
    ON public.organization_roles FOR ALL TO authenticated
    USING (organization_id IS NOT NULL AND private.is_org_admin(organization_id))
    WITH CHECK (organization_id IS NOT NULL AND private.is_org_admin(organization_id));

ALTER TABLE public.organization_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view organization role permissions"
    ON public.organization_role_permissions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Org admins can manage custom role permissions"
    ON public.organization_role_permissions FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_roles r
            WHERE r.id = organization_role_id
              AND r.organization_id IS NOT NULL
              AND private.is_org_admin(r.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_roles r
            WHERE r.id = organization_role_id
              AND r.organization_id IS NOT NULL
              AND private.is_org_admin(r.organization_id)
        )
    );


