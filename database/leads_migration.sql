-- ============================================================
-- TitanOS: Lead Intelligence System
-- Migration for lead tracking and CRM integration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  source text NOT NULL, -- 'LinkedIn Pattern Interrupt', 'IG Authority Pillar', etc.
  quality text NOT NULL CHECK (quality IN ('High', 'Medium', 'Low')),
  status text NOT NULL DEFAULT 'Pending', -- 'Agent Contacted', 'Pending', 'Scheduled meeting', etc.
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexing for project-based lookups
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads (project_id);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view leads for their projects" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage leads for their projects" ON public.leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Lead seeding helper (Optional - can be run manually)
-- INSERT INTO public.leads (project_id, name, source, quality, status)
-- SELECT id, 'Alex Johnson', 'LinkedIn Pattern Interrupt', 'High', 'Agent Contacted' FROM public.projects LIMIT 1;
-- INSERT INTO public.leads (project_id, name, source, quality, status)
-- SELECT id, 'Sarah Miller', 'IG Authority Pillar', 'Medium', 'Pending' FROM public.projects LIMIT 1;
-- INSERT INTO public.leads (project_id, name, source, quality, status)
-- SELECT id, 'Marcus Chen', 'X Velocity Hack', 'High', 'Scheduled meeting' FROM public.projects LIMIT 1;
