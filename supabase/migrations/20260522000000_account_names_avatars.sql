-- ================================================================
-- ACCOUNT NAMES & AVATARS
--
-- Append-only log of display name and avatar changes per account.
-- created_at is forced to NOW() in a BEFORE INSERT trigger so
-- callers cannot supply a forged timestamp.
-- ================================================================

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------

CREATE TABLE public.account_names (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id  BIGINT       NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name        TEXT         NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
    created_at  TIMESTAMPTZ  NOT NULL
);

CREATE INDEX ON public.account_names(account_id, created_at DESC);

CREATE TABLE public.account_avatars (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id  BIGINT       NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    url         TEXT         NOT NULL CHECK (char_length(url) BETWEEN 1 AND 2048),
    created_at  TIMESTAMPTZ  NOT NULL
);

CREATE INDEX ON public.account_avatars(account_id, created_at DESC);

-- ----------------------------------------------------------------
-- Triggers: force created_at = NOW() on every insert
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.on_insert_account_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_insert_account_name
BEFORE INSERT ON public.account_names
FOR EACH ROW EXECUTE FUNCTION private.on_insert_account_name();

CREATE OR REPLACE FUNCTION private.on_insert_account_avatar()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_insert_account_avatar
BEFORE INSERT ON public.account_avatars
FOR EACH ROW EXECUTE FUNCTION private.on_insert_account_avatar();

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------

ALTER TABLE public.account_names   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_avatars ENABLE ROW LEVEL SECURITY;

-- Owners can insert their own records
CREATE POLICY "Account owners can insert their own names"
    ON public.account_names
    FOR INSERT
    WITH CHECK (private.owns_account(account_id));

CREATE POLICY "Account owners can insert their own avatars"
    ON public.account_avatars
    FOR INSERT
    WITH CHECK (private.owns_account(account_id));

-- Owners can read their own records
CREATE POLICY "Account owners can view their own names"
    ON public.account_names
    FOR SELECT
    USING (private.owns_account(account_id));

CREATE POLICY "Account owners can view their own avatars"
    ON public.account_avatars
    FOR SELECT
    USING (private.owns_account(account_id));
