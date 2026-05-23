CREATE TYPE public.billing_provider AS ENUM ('stripe', 'paddle', 'manual');

CREATE TABLE public.organizations (
    id                           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug                         TEXT        NOT NULL UNIQUE,
    owner_account_id             BIGINT      NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    billing_provider             public.billing_provider,
    billing_provider_customer_id TEXT        UNIQUE,
    metadata                     JSONB       NOT NULL DEFAULT '{}',
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_organizations_owner ON public.organizations(owner_account_id);
CREATE INDEX idx_organizations_billing_customer ON public.organizations(billing_provider_customer_id) WHERE billing_provider_customer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.on_update_organization() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_update_organization BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION private.on_update_organization();

CREATE OR REPLACE FUNCTION private.on_insert_organizations() RETURNS TRIGGER AS $$ BEGIN NEW.created_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_organizations_inserted BEFORE INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION private.on_insert_organizations();

CREATE TABLE public.organization_names (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.organization_names ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_organization_names_org ON public.organization_names(organization_id);

CREATE OR REPLACE FUNCTION private.on_insert_organization_names() RETURNS TRIGGER AS $$ BEGIN NEW.created_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_organization_names_inserted BEFORE INSERT ON public.organization_names FOR EACH ROW EXECUTE FUNCTION private.on_insert_organization_names();

CREATE TABLE public.organization_billing_emails (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    billing_email   TEXT    NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.organization_billing_emails ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_organization_billing_emails_org ON public.organization_billing_emails(organization_id);

CREATE OR REPLACE FUNCTION private.on_insert_organization_billing_emails() RETURNS TRIGGER AS $$ BEGIN NEW.created_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_organization_billing_emails_inserted BEFORE INSERT ON public.organization_billing_emails FOR EACH ROW EXECUTE FUNCTION private.on_insert_organization_billing_emails();

ALTER TABLE public.organization_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_billing_emails ENABLE ROW LEVEL SECURITY;