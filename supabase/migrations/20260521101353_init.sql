CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA private;

CREATE TABLE public.accounts (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION private.on_create_account()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_create_account
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION private.on_create_account();


CREATE OR REPLACE FUNCTION private.on_user_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, created_at, updated_at)
    VALUES (
        NEW.id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION private.on_user_created();
