import { createAdminClient } from '@/supabase/server';

export async function enqueueDistributionJob({
    campaignId,
    assetId,
    platform,
    scheduledTime = new Date().toISOString(),
    metadata = {},
    caption,
    mediaUrls
}: {
    campaignId: string;
    assetId: string;
    platform: string;
    scheduledTime?: string;
    metadata?: any;
    caption?: string;
    mediaUrls?: string[];
}) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('distribution_jobs')
        .insert({
            campaign_id: campaignId,
            asset_id: assetId,
            platform,
            scheduled_time: scheduledTime,
            status: 'pending',
            metadata,
            caption: caption || null,
            media_urls: mediaUrls || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error enqueuing distribution job:', error);
        throw error;
    }

    return data;
}
