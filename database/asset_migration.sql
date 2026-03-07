-- ============================================================
-- TitanOS: Asset Management & Campaign Refactor
-- Additive migration for campaign ownership and assets
-- ============================================================

-- 1. Add Strategy and Funnel links to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS strategy_id uuid REFERENCES public.positioning_output(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES public.funnel_output(id) ON DELETE SET NULL;

-- 2. Create campaign_assets table
CREATE TABLE IF NOT EXISTS public.campaign_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_type text NOT NULL, -- 'flyer', 'video', 'image', etc.
  asset_url text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS for assets
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access campaign_assets" ON public.campaign_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = campaign_id AND p.user_id = auth.uid()
    )
  );

-- 4. (Optional) Migrate existing flyers from campaigns table to assets table
-- We'll keep the columns in campaigns for now for backward compatibility or just ignore them.
