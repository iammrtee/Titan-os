-- ============================================================
-- TitanOS: Phase 1 Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users Profile Table ─────────────────────────────────────
-- Extends Supabase auth.users with role and metadata
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'starter' CHECK (role IN ('admin', 'pro', 'growth', 'starter')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'starter');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text NOT NULL,
  business_details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Website Analysis ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_analysis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  raw_content text NOT NULL DEFAULT '',
  analysis_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Positioning Output ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.positioning_output (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  positioning_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Funnel Output ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funnel_output (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  funnel_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Content Calendar ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  calendar_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Ad Campaigns ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  campaigns_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positioning_output ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_output ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- ─── users RLS ───────────────────────────────────────────────
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create a SECURITY DEFINER function to bypass RLS when checking admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  is_admin boolean;
  user_email text;
BEGIN
  -- Check for hardcoded admin email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email = 'tazrt37@gmail.com' THEN
    RETURN true;
  END IF;

  SELECT (role = 'admin') INTO is_admin FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin());

-- ─── projects RLS ────────────────────────────────────────────
CREATE POLICY "Users can CRUD own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all projects" ON public.projects
  FOR SELECT USING (public.is_admin());

-- ─── AI output tables RLS (helper macro pattern) ─────────────
-- website_analysis
CREATE POLICY "Owner access website_analysis" ON public.website_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

-- positioning_output
CREATE POLICY "Owner access positioning_output" ON public.positioning_output
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

-- funnel_output
CREATE POLICY "Owner access funnel_output" ON public.funnel_output
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

-- content_calendar
CREATE POLICY "Owner access content_calendar" ON public.content_calendar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

-- ad_campaigns
CREATE POLICY "Owner access ad_campaigns" ON public.ad_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );
