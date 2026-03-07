-- ============================================================
-- TitanOS: Social Authentication Schema
-- Stores OAuth tokens for different platforms per user
-- ============================================================

CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'facebook', 'tiktok', 'x')),
  username text,
  display_name text,
  avatar_url text,
  
  -- OAuth Credentials (Encrypted or handled via Supabase Auth/Vault)
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  
  -- Platform Specific IDs
  platform_user_id text NOT NULL,
  platform_org_id text, -- Specifically for LinkedIn Organizations
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- One account per platform per user
  UNIQUE(user_id, platform, platform_user_id)
);

-- RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social accounts" ON public.social_accounts
  FOR ALL USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_social_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_accounts_modtime
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_accounts_timestamp();
