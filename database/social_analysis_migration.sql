-- ============================================================
-- TitanOS: Social Analysis System
-- Migration for tracking social media links for analysis
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_social_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platform text NOT NULL, -- 'instagram', 'linkedin', 'facebook', 'tiktok', 'other'
  url text NOT NULL,
  title text,
  metrics jsonb DEFAULT '{"reach": 0, "engagement": 0, "efficiency": 0}'::jsonb,
  last_analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.project_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their project social links" ON public.project_social_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can add social links" ON public.project_social_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete social links" ON public.project_social_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER tr_update_social_links_updated_at
  BEFORE UPDATE ON public.project_social_links
  FOR EACH ROW EXECUTE FUNCTION update_dist_job_updated_at(); -- Reusing previous function
