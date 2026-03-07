-- ============================================================
-- TitanOS: Campaign System Schema (Additive — run in Supabase SQL Editor)
-- Existing tables are NOT modified.
-- ============================================================

-- ─── campaigns ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  flyer_image_url text,
  flyer_content text,
  flyer_style text,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'complete', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── campaign_content ────────────────────────────────────────
-- Stores all AI-generated copy per platform per campaign
CREATE TABLE IF NOT EXISTS public.campaign_content (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'general')),
  content_type text NOT NULL CHECK (content_type IN ('caption', 'hook', 'cta', 'video_script', 'ad_copy', 'strategy')),
  body text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── campaign_calendar ───────────────────────────────────────
-- 30-day posting schedule
CREATE TABLE IF NOT EXISTS public.campaign_calendar (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  platform text NOT NULL,
  content_type text NOT NULL,
  content_body text NOT NULL,
  scheduled_for date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access campaigns" ON public.campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Owner access campaign_content" ON public.campaign_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = campaign_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner access campaign_calendar" ON public.campaign_calendar
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = campaign_id AND p.user_id = auth.uid()
    )
  );
