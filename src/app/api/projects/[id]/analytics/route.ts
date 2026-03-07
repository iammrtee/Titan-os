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

        // Parallelize all primary data fetches
        const [
            campaignsRes
        ] = await Promise.all([
            supabase.from('campaigns').select('id').eq('project_id', id)
        ]);

        const campaignCount = campaignsRes.data?.length || 0;
        const campaignIds = campaignsRes.data?.map(c => c.id) || [];
        const socialLinks: any[] = [];

        let assetCount = 0;
        let jobSummary = { pending: 0, processing: 0, success: 0, failed: 0 };
        let activity: any[] = [];

        if (campaignIds.length > 0) {
            const [assetsRes, jobsRes, activityRes] = await Promise.all([
                supabase.from('campaign_assets').select('*', { count: 'exact', head: true }).in('campaign_id', campaignIds),
                supabase.from('distribution_jobs').select('status').in('campaign_id', campaignIds),
                supabase.from('distribution_jobs')
                    .select('platform, status, updated_at, campaign_assets(asset_url)')
                    .in('campaign_id', campaignIds)
                    .order('updated_at', { ascending: false })
                    .limit(5)
            ]);

            assetCount = assetsRes.count || 0;
            jobsRes.data?.forEach(job => {
                if (job.status in jobSummary) {
                    jobSummary[job.status as keyof typeof jobSummary]++;
                }
            });
            activity = activityRes.data || [];
        }

        return NextResponse.json({
            stats: {
                campaigns: campaignCount,
                assets: assetCount,
                distribution: jobSummary
            },
            recentActivity: activity,
            socialLinks: socialLinks
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
