import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import {
    runWebsiteAnalysis,
    runPositioning,
    runFunnel,
    runContentCalendar,
    runAdCampaigns,
    runContentAssets,
} from '@/ai/chain';
import { updateProjectStatus } from '@/database/queries';

export const maxDuration = 300; // 5 minutes for full chain

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await request.json();
    if (!projectId) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Fetch project and verify ownership
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, business_details, website_url, name')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    if (projectError || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    try {
        // Set project to generating
        await updateProjectStatus(projectId, 'generating');

        // Handle parsing of explicit business details (JSON vs Plain Text Fallback)
        let parsedDetails: any = {};
        let rawContentBlock = project.business_details;
        try {
            parsedDetails = JSON.parse(project.business_details);
            // Reconstruct a readable blob for backwards-compatible prompts if needed
            rawContentBlock = `
Niche: ${parsedDetails.niche || ''}
Audience: ${parsedDetails.target_audience || ''}
Offer: ${parsedDetails.offer || ''}
Revenue Goal: ${parsedDetails.revenue_goal || ''}
Platform: ${parsedDetails.platform || ''}
Tone: ${parsedDetails.tone || ''}
Current Funnel: ${parsedDetails.current_funnel || ''}
Extra: ${parsedDetails.extra_details || ''}
            `.trim();
        } catch (e) {
            // It's just older plain text
        }

        // ─── Step 1: Website Analysis ──────────────────────────────
        const analysis = await runWebsiteAnalysis(
            project.website_url,
            rawContentBlock,
        );
        await supabase.from('website_analysis').upsert({
            project_id: projectId,
            raw_content: project.business_details,
            analysis_json: analysis,
        });

        // ─── Step 2: Brand Positioning ────────────────────────────
        const positioning = await runPositioning(analysis, rawContentBlock);
        await supabase.from('positioning_output').upsert({
            project_id: projectId,
            positioning_json: positioning,
        });

        // ─── Step 3 & 4: Marketing Funnel ─────────────────────────
        const funnel = await runFunnel(analysis, positioning, parsedDetails.current_funnel);
        await supabase.from('funnel_output').upsert({
            project_id: projectId,
            funnel_json: funnel,
        });

        // ─── Step 5: Content Calendar ─────────────────────────────
        const calendar = await runContentCalendar(
            positioning,
            funnel,
            project.name,
            analysis.business_type,
            analysis.target_audience_segments?.[0] || 'Target Audience'
        );
        await supabase.from('content_calendar').upsert({
            project_id: projectId,
            calendar_json: calendar,
        });

        // ─── Step 6: Ad Campaigns ─────────────────────────────────
        const ads = await runAdCampaigns(positioning, funnel);
        await supabase.from('ad_campaigns').upsert({
            project_id: projectId,
            campaigns_json: ads,
        });

        // ─── Step 7: Content Creation Assets ──────────────────────
        const assets = await runContentAssets(positioning, calendar);
        await supabase.from('content_assets').upsert({
            project_id: projectId,
            assets_json: assets,
        });

        // Mark complete
        await updateProjectStatus(projectId, 'completed');

        return NextResponse.json({
            success: true,
            data: { analysis, positioning, funnel, calendar, ads, assets },
        });
    } catch (error: any) {
        await updateProjectStatus(projectId, 'failed');
        console.error('[AI Chain Error]', error);

        // Return the actual error message if available
        const errorMessage = error?.message || 'AI generation failed. Please try again.';

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 },
        );
    }
}
