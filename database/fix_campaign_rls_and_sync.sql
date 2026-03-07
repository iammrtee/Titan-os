-- ============================================================
-- TitanOS: Fix RLS Ambiguity and Resilient Strategy Sync
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Fix RLS for campaign_assets (Qualify column names)
DROP POLICY IF EXISTS "Owner access campaign_assets" ON public.campaign_assets;
CREATE POLICY "Owner access campaign_assets" ON public.campaign_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = public.campaign_assets.campaign_id AND p.user_id = auth.uid()
    )
  );

-- 2. Fix RLS for distribution_jobs (Qualify column names)
DROP POLICY IF EXISTS "Owners can schedule distribution jobs" ON public.distribution_jobs;
CREATE POLICY "Owners can schedule distribution jobs" ON public.distribution_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = public.distribution_jobs.campaign_id AND p.user_id = auth.uid()
    )
  );

-- 3. Resilient Sync: Clean up and Push Project Strategy into Campaign Content
-- Remove potentially empty strategy records first
DELETE FROM public.campaign_content 
WHERE content_type = 'strategy' 
AND (body = '{}' OR body LIKE '%"icp": null%' OR body LIKE '%"icp": ""%');

-- Re-insert with NULL-safe CONCAT
INSERT INTO public.campaign_content (campaign_id, platform, content_type, body, sort_order)
SELECT 
    c.id as campaign_id,
    'general' as platform,
    'strategy' as content_type,
    jsonb_build_object(
        'icp', CONCAT(
            COALESCE(po.positioning_json->'strategic_narrative'->>'new_category_name', 'Category'),
            ' targeting ',
            COALESCE(po.positioning_json->'strategic_narrative'->>'the_villain', 'the market pain')
        ),
        'positioningStatement', COALESCE(po.positioning_json->'positioning_architecture'->>'identity_statement', 'Positioning not yet defined.'),
        'offerAngle', COALESCE(po.positioning_json->'positioning_architecture'->>'the_titan_promise', 'Irresistible offer under development.'),
        'campaignObjective', 'Organic Growth',
        'targetPlatforms', jsonb_build_array('instagram', 'linkedin', 'tiktok')
    )::text as body,
    0 as sort_order
FROM public.campaigns c
JOIN public.positioning_output po ON po.project_id = c.project_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.campaign_content cc 
    WHERE cc.campaign_id = c.id AND cc.content_type = 'strategy'
)
ON CONFLICT DO NOTHING;
