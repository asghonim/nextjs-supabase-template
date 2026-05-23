-- ================================================================
-- API KEYS
--
-- API keys allow programmatic access to the API, scoped to an
-- organization. Any org member may create, update, and revoke keys.
--
-- Security model:
--   * Only the SHA-256 hash of the key is stored — plaintext is
--     shown once at creation time and never persisted.
--   * key_prefix (first 16 chars) is stored for display only.
--   * Revoked/expired keys are rejected by verify_api_key().
--   * RLS restricts access to members of the owning organization.
-- ================================================================
CREATE TABLE public.api_scopes (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         TEXT        NOT NULL UNIQUE,
    name        TEXT        NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.api_scopes (key, name, description) VALUES
    ('read',           'Read',           'Read-only access to all resources'),
    ('write',          'Write',          'Read and write access to all resources'),
    ('qr:read',        'QR Read',        'Read QR code resources'),
    ('qr:write',       'QR Write',       'Create and update QR code resources'),
    ('analytics:read', 'Analytics Read', 'Access analytics data'),
    ('webhooks:write', 'Webhooks Write', 'Manage webhook endpoints'),
    ('billing:read',   'Billing Read',   'Read billing and invoice data');

ALTER TABLE public.api_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view api scopes"
    ON public.api_scopes FOR SELECT TO authenticated USING (TRUE);

CREATE TABLE public.api_keys (
    id           BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    org_id       BIGINT       NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_id   BIGINT       NOT NULL REFERENCES public.accounts(id)      ON DELETE CASCADE,
    name         TEXT         NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    key_prefix   TEXT         NOT NULL,
    key_hash     TEXT         NOT NULL UNIQUE,
    scopes       TEXT[]       NOT NULL DEFAULT '{}',
    expires_at   TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org     ON public.api_keys(org_id);
CREATE INDEX idx_api_keys_account ON public.api_keys(account_id);
CREATE INDEX idx_api_keys_hash   ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view api keys"
    ON public.api_keys FOR SELECT TO authenticated
    USING (private.is_org_member(org_id));

CREATE POLICY "Org members can delete api keys"
    ON public.api_keys FOR DELETE TO authenticated
    USING (private.is_org_member(org_id));

CREATE OR REPLACE FUNCTION public.verify_api_key(p_key_hash TEXT)
RETURNS TABLE (
    id         BIGINT,
    org_id     BIGINT,
    account_id BIGINT,
    scopes     TEXT[],
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.api_keys k
    SET last_used_at = NOW()
    WHERE k.key_hash  = p_key_hash
      AND k.revoked_at IS NULL
      AND (k.expires_at IS NULL OR k.expires_at > NOW())
    RETURNING k.id, k.org_id, k.account_id, k.scopes, k.expires_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_api_key(TEXT) FROM PUBLIC, authenticated;
GRANT  EXECUTE ON FUNCTION public.verify_api_key(TEXT) TO service_role;
