-- ============================================================
-- TitanOS: Content Creation Assets Table
-- Migration to store campaign AI assets
-- ============================================================

CREATE TABLE IF NOT EXISTS public.content_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  assets_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access content_assets" ON public.content_assets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );
