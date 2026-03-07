-- ============================================================
-- TitanOS: Asynchronous Distribution System
-- Migration for distribution jobs tracking
-- ============================================================

CREATE TYPE distribution_job_status AS ENUM ('pending', 'processing', 'success', 'failed');

CREATE TABLE IF NOT EXISTS public.distribution_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.campaign_assets(id) ON DELETE CASCADE,
  platform text NOT NULL, -- 'instagram', 'linkedin', 'facebook', etc.
  scheduled_time timestamptz NOT NULL DEFAULT now(),
  status distribution_job_status NOT NULL DEFAULT 'pending',
  retry_count int NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexing for worker polling
CREATE INDEX IF NOT EXISTS idx_distribution_jobs_status_scheduled ON public.distribution_jobs (status, scheduled_time);

-- RLS
ALTER TABLE public.distribution_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own distribution jobs" ON public.distribution_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = campaign_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can schedule distribution jobs" ON public.distribution_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = campaign_id AND p.user_id = auth.uid()
    )
  );

-- Function to handle job updates timestamp
CREATE OR REPLACE FUNCTION update_dist_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_dist_job_updated_at
  BEFORE UPDATE ON public.distribution_jobs
  FOR EACH ROW EXECUTE FUNCTION update_dist_job_updated_at();
