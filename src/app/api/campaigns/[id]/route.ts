import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Fetch Campaign & Core Data with minimal fields to save egress
        const [campaignRes, contentRes, assetsRes, jobsRes, calendarRes] = await Promise.all([
            supabase.from('campaigns').select('id, status, flyer_image_url, flyer_content, created_at, project_id, projects!inner(id, name, user_id)').eq('id', id).single(),
            supabase.from('campaign_content').select('id, platform, content_type, body, sort_order').eq('campaign_id', id).order('sort_order', { ascending: true }),
            supabase.from('campaign_assets').select('id, asset_url, asset_type, created_at').eq('campaign_id', id).order('created_at', { ascending: false }),
            supabase.from('distribution_jobs').select('id, platform, status, scheduled_time, error_message, updated_at').eq('campaign_id', id).order('created_at', { ascending: false }),
            supabase.from('campaign_calendar').select('id, day_number, platform, content_type, content_body, status').eq('campaign_id', id).order('day_number', { ascending: true })
        ]);

        if (campaignRes.error || !campaignRes.data) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        const campaign = campaignRes.data;

        let finalContent = contentRes.data || [];
        let finalCalendar = calendarRes.data || [];

        // 2. Efficient Fallback: Only fetch if necessary
        const hasStrategy = finalContent.some(r => r.content_type === 'strategy');

        if (!hasStrategy || finalCalendar.length === 0) {
            const [posRes, calRes, adsRes, aiAssetsRes] = await Promise.all([
                supabase.from('positioning_output').select('positioning_json').eq('project_id', campaign.project_id).maybeSingle(),
                supabase.from('content_calendar').select('calendar_json').eq('project_id', campaign.project_id).maybeSingle(),
                supabase.from('ad_campaigns').select('campaigns_json').eq('project_id', campaign.project_id).maybeSingle(),
                supabase.from('content_assets').select('assets_json').eq('project_id', campaign.project_id).maybeSingle()
            ]);

            // Map Strategy if missing
            if (!hasStrategy && posRes.data?.positioning_json) {
                const pos = posRes.data.positioning_json;
                // Ensure we handle both string and object if Supabase client behavior varies
                const p = typeof pos === 'string' ? JSON.parse(pos) : pos;

                finalContent.push({
                    id: 'fallback-str', platform: 'general', content_type: 'strategy',
                    body: JSON.stringify({
                        icp: `${p.strategic_narrative?.new_category_name || 'Category'} targeting ${p.strategic_narrative?.the_villain || 'the market pain'}.`,
                        positioningStatement: p.positioning_architecture?.identity_statement || 'Positioning not yet defined.',
                        offerAngle: p.positioning_architecture?.the_titan_promise || 'Irresistible offer under development.',
                        campaignObjective: "Organic Growth",
                        targetPlatforms: ["instagram", "linkedin", "tiktok"]
                    }),
                    sort_order: 0
                });
            }

            // Map Content (Hooks/CTAs/Scripts)
            if (adsRes.data?.campaigns_json?.variants) {
                adsRes.data.campaigns_json.variants.slice(0, 5).forEach((v: any, i: number) => {
                    finalContent.push({ id: `fh-${i}`, platform: 'general', content_type: 'hook', body: v.headline, sort_order: 10 + i });
                    finalContent.push({ id: `fc-${i}`, platform: 'general', content_type: 'cta', body: v.cta, sort_order: 20 + i });
                });
            }

            // Map additional hooks from video scripts if available
            if (aiAssetsRes.data?.assets_json?.video_scripts) {
                aiAssetsRes.data.assets_json.video_scripts.slice(0, 3).forEach((s: any, i: number) => {
                    finalContent.push({ id: `fv-${i}`, platform: 'general', content_type: 'video_script', body: s.body, sort_order: 40 + i });
                    // Also use video hooks as general hook variations
                    if (s.hook) {
                        finalContent.push({ id: `fvh-${i}`, platform: 'general', content_type: 'hook', body: s.hook, sort_order: 15 + i });
                    }
                });
            }

            // Map Emotionally Compelling CTAs from positioning
            if (posRes.data?.positioning_json?.conversion_intelligence?.emotionally_compelling_ctas) {
                posRes.data.positioning_json.conversion_intelligence.emotionally_compelling_ctas.forEach((cta: string, i: number) => {
                    finalContent.push({ id: `fec-${i}`, platform: 'general', content_type: 'cta', body: cta, sort_order: 25 + i });
                });
            }

            // Map Calendar
            if (finalCalendar.length === 0 && calRes.data?.calendar_json?.entries) {
                finalCalendar = calRes.data.calendar_json.entries.slice(0, 30).map((e: any, i: number) => ({
                    id: `fcal-${i}`, day_number: e.day || (i + 1), platform: e.platform, content_type: e.content_type, content_body: e.caption_hook || e.core_message, status: 'draft'
                }));
            }
        }

        return NextResponse.json({
            campaign,
            content: finalContent,
            calendar: finalCalendar,
            assets: assetsRes.data || [],
            distributionJobs: jobsRes.data || []
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
    }
}
