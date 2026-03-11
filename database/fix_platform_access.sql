-- ============================================================
-- TitanOS: Fix Platform Access & Admin Visibility
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Update Campaigns RLS to include Admins
DROP POLICY IF EXISTS "Owner access campaigns" ON public.campaigns;
CREATE POLICY "Owner access campaigns" ON public.campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (user_id = auth.uid() OR public.is_admin()))
  );

-- 2. Update Campaign Content RLS to include Admins
DROP POLICY IF EXISTS "Owner access campaign_content" ON public.campaign_content;
CREATE POLICY "Owner access campaign_content" ON public.campaign_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = campaign_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 3. Update Campaign Calendar RLS to include Admins
DROP POLICY IF EXISTS "Owner access campaign_calendar" ON public.campaign_calendar;
CREATE POLICY "Owner access campaign_calendar" ON public.campaign_calendar
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = campaign_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 4. Fix stuck generating projects
-- This updates projects to 'completed' if they have a content_calendar record (usually the last step)
UPDATE public.projects
SET status = 'completed'
WHERE status = 'generating'
AND EXISTS (SELECT 1 FROM public.content_calendar WHERE project_id = public.projects.id);
