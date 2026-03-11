import { createClient } from '@supabase/supabase-js';
import { createMockAdminClient, isBypassEnabled } from '@/supabase/mock';
import { runStrategyAgent } from './strategyAgent';
import { runContentAgent } from './contentAgent';
import { runCalendarAgent } from './calendarAgent';

// Service role client for server-side writes
function getServiceClient() {
    if (isBypassEnabled()) {
        return createMockAdminClient();
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface OrchestratorInput {
    projectId: string;
    projectName: string;
    businessDetails: string;
    flyerContent: string;
    flyerImageUrl?: string;
    flyerStyle?: string;
    positioningData?: string;
}

export type ProgressEvent =
    | { stage: 'strategy'; status: 'running' }
    | { stage: 'strategy'; status: 'done'; data: object }
    | { stage: 'content'; status: 'running' }
    | { stage: 'content'; status: 'done'; data: object }
    | { stage: 'calendar'; status: 'running' }
    | { stage: 'calendar'; status: 'done'; data: object }
    | { stage: 'complete'; campaignId: string }
    | { stage: 'error'; message: string };

export async function* runOrchestrator(
    input: OrchestratorInput
): AsyncGenerator<ProgressEvent> {
    const supabase = getServiceClient();

    // Create the campaign row first
    const { data: campaign, error: campaignErr } = await supabase
        .from('campaigns')
        .insert({
            project_id: input.projectId,
            flyer_image_url: input.flyerImageUrl || null,
            flyer_content: input.flyerContent,
            flyer_style: input.flyerStyle || null,
            status: 'generating',
        })
        .select('id')
        .single();

    if (campaignErr || !campaign) {
        yield { stage: 'error', message: campaignErr?.message || 'Failed to create campaign' };
        return;
    }

    const campaignId = campaign.id;

    try {
        // ── STAGE 1: Strategy ──────────────────────────────────────
        yield { stage: 'strategy', status: 'running' };
        const strategy = await runStrategyAgent({
            projectName: input.projectName,
            businessDetails: input.businessDetails,
            flyerContent: input.flyerContent,
            positioningData: input.positioningData,
        });

        // Save strategy to campaign_content
        await supabase.from('campaign_content').insert({
            campaign_id: campaignId,
            platform: 'general',
            content_type: 'strategy',
            body: JSON.stringify(strategy),
            sort_order: 0,
        });

        yield { stage: 'strategy', status: 'done', data: strategy };

        // ── STAGE 2: Content ───────────────────────────────────────
        yield { stage: 'content', status: 'running' };
        const content = await runContentAgent({
            strategy,
            flyerContent: input.flyerContent,
            projectName: input.projectName,
        });

        // Save per-platform content rows
        const platforms = ['instagram', 'facebook', 'linkedin', 'tiktok'] as const;
        const contentRows = platforms.flatMap((platform, pi) => [
            { campaign_id: campaignId, platform, content_type: 'caption', body: content[platform].caption, sort_order: pi * 10 },
            { campaign_id: campaignId, platform, content_type: 'hook', body: content[platform].hook, sort_order: pi * 10 + 1 },
            { campaign_id: campaignId, platform, content_type: 'cta', body: content[platform].cta, sort_order: pi * 10 + 2 },
        ]);

        // Hooks, CTAs, video script, ad copy — general
        const generalRows = [
            ...content.hooks.map((h, i) => ({ campaign_id: campaignId, platform: 'general', content_type: 'hook', body: h, sort_order: 100 + i })),
            ...content.ctas.map((c, i) => ({ campaign_id: campaignId, platform: 'general', content_type: 'cta', body: c, sort_order: 110 + i })),
            { campaign_id: campaignId, platform: 'general', content_type: 'video_script', body: content.videoScript, sort_order: 120 },
            ...content.adCopy.map((a, i) => ({ campaign_id: campaignId, platform: 'general', content_type: 'ad_copy', body: a, sort_order: 130 + i })),
        ];

        await supabase.from('campaign_content').insert([...contentRows, ...generalRows]);
        yield { stage: 'content', status: 'done', data: content };

        // ── STAGE 3: Calendar ──────────────────────────────────────
        yield { stage: 'calendar', status: 'running' };
        const calendarDays = await runCalendarAgent({
            strategy,
            content,
            projectName: input.projectName,
        });

        const calendarRows = calendarDays.map(day => ({
            campaign_id: campaignId,
            day_number: day.day,
            platform: day.platform,
            content_type: day.contentType,
            content_body: day.contentBody,
            scheduled_for: day.scheduledFor || null,
            status: 'draft',
        }));

        await supabase.from('campaign_calendar').insert(calendarRows);
        yield { stage: 'calendar', status: 'done', data: { days: calendarDays.length } };

        // ── Mark complete ──────────────────────────────────────────
        await supabase.from('campaigns').update({ status: 'complete' }).eq('id', campaignId);
        yield { stage: 'complete', campaignId };

    } catch (err: any) {
        await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId);
        yield { stage: 'error', message: err?.message || 'Campaign generation failed' };
    }
}
