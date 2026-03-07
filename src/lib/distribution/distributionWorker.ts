import { createAdminClient } from '@/supabase/server';
import { MockPlatformAdapter } from './platformAdapters/mockAdapter';
import { PlatformAdapter } from './platformAdapters';
import { LinkedInPlatformAdapter } from './platformAdapters/linkedinAdapter';
import { InstagramPlatformAdapter } from './platformAdapters/instagramAdapter';
import { FacebookPlatformAdapter } from './platformAdapters/facebookAdapter';
import { XPlatformAdapter } from './platformAdapters/xAdapter';
import { TikTokPlatformAdapter } from './platformAdapters/tiktokAdapter';

const PLATFORM_ADAPTERS: Record<string, PlatformAdapter> = {
    instagram: new InstagramPlatformAdapter(),
    linkedin: new LinkedInPlatformAdapter(),
    facebook: new FacebookPlatformAdapter(),
    tiktok: new TikTokPlatformAdapter(),
    x: new XPlatformAdapter(),
};

console.log('[Worker] Social Platforms Initialized:', Object.keys(PLATFORM_ADAPTERS).join(', '));

const CONCURRENCY_LIMIT = 2;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function processDistributionJobs() {
    const supabase = createAdminClient();

    // 1. Fetch pending jobs that are due
    const { data: jobs, error: fetchError } = await supabase
        .from('distribution_jobs')
        .select(`
            *,
            campaign_assets(id, asset_url),
            campaigns(
                id, 
                flyer_content,
                projects(user_id)
            )
        `)
        .eq('status', 'pending')
        .lte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(CONCURRENCY_LIMIT); // Enforce concurrency limit at fetch level

    if (fetchError) {
        console.error('Error fetching distribution jobs:', fetchError);
        return;
    }

    if (!jobs || jobs.length === 0) return;

    console.log(`[RateController] Found ${jobs.length} jobs to process. Concurrency limit: ${CONCURRENCY_LIMIT}`);

    // 2. Process jobs in parallel for efficiency
    console.log(`[RateController] Processing batch of ${jobs.length} in parallel.`);

    await Promise.all(jobs.map(async (job) => {
        try {
            // 3. Platform Cooldown Check (10 minutes)
            const { data: recentJob } = await supabase
                .from('distribution_jobs')
                .select('updated_at')
                .eq('platform', job.platform)
                .eq('status', 'success')
                .order('updated_at', { ascending: false })
                .limit(1);

            if (recentJob && recentJob.length > 0) {
                const lastPostTime = new Date(recentJob[0].updated_at).getTime();
                const now = Date.now();
                const diffMinutes = (now - lastPostTime) / (1000 * 60);

                if (diffMinutes < 10) {
                    console.log(`[RateController] Skipping ${job.platform} for job ${job.id} due to cooldown (${Math.round(10 - diffMinutes)}m remaining).`);
                    return;
                }
            }

            // 4. Randomized Execution Delay (20-90s)
            const delaySeconds = Math.floor(Math.random() * (90 - 20 + 1)) + 20;
            console.log(`[RateController] Job ${job.id} pending (${delaySeconds}s delay)...`);
            await sleep(delaySeconds * 1000);

            // 5. Fetch Social Token (graceful — table may not exist yet)
            const userId = (job.campaigns.projects as any)?.user_id;
            const { data: account, error: accountError } = await supabase
                .from('social_accounts')
                .select('*')
                .eq('user_id', userId)
                .eq('platform', job.platform.toLowerCase())
                .maybeSingle();

            // If social_accounts table doesn't exist or no account found,
            // reset to pending so the local Playwright daemon can process it
            if (accountError || !account) {
                const reason = accountError
                    ? `social_accounts table unavailable (${accountError.message})`
                    : `No ${job.platform} account connected`;
                console.log(`[Worker] Job ${job.id} → resetting to pending: ${reason}`);
                await supabase
                    .from('distribution_jobs')
                    .update({ status: 'pending', error_message: null })
                    .eq('id', job.id);
                return;
            }

            // 6. Mark as processing
            await supabase
                .from('distribution_jobs')
                .update({ status: 'processing' })
                .eq('id', job.id);

            const adapter = PLATFORM_ADAPTERS[job.platform.toLowerCase()];
            if (!adapter) {
                throw new Error(`No adapter found for platform: ${job.platform}`);
            }

            // 7. Execute distribution
            const result = await adapter.postAsset(
                job.campaign_assets.asset_url,
                job.campaigns.flyer_content || 'Check out our new asset!',
                {
                    ...job.metadata,
                    ...account?.metadata,
                    accessToken: account?.access_token,
                    platform_user_id: account?.platform_user_id,
                    openId: account?.platform_user_id, // For TikTok
                    orgId: account?.metadata?.primary_org_id || account?.platform_org_id || account?.platform_user_id,
                    pageId: account?.metadata?.primary_page_id || account?.platform_user_id,
                    businessId: account?.metadata?.primary_business_id || account?.platform_user_id,
                }
            );

            if (result.success) {
                await supabase
                    .from('distribution_jobs')
                    .update({
                        status: 'success',
                        metadata: { ...job.metadata, platformJobId: result.platformJobId }
                    })
                    .eq('id', job.id);
                console.log(`[RateController] Job ${job.id} successful.`);
            } else {
                throw new Error(result.error || 'Unknown distribution error');
            }

        } catch (err: any) {
            console.error(`[RateController] Job ${job.id} failed:`, err.message);

            const nextRetryCount = job.retry_count + 1;
            const finalStatus = nextRetryCount >= 5 ? 'failed' : 'pending';

            const backoffMinutes = 5 * Math.pow(2, nextRetryCount);
            const nextScheduledTime = new Date(Date.now() + 1000 * 60 * backoffMinutes).toISOString();

            await supabase
                .from('distribution_jobs')
                .update({
                    status: finalStatus,
                    retry_count: nextRetryCount,
                    error_message: err.message,
                    scheduled_time: nextScheduledTime
                })
                .eq('id', job.id);
        }
    }));
}
