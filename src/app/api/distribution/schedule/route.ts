import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { enqueueDistributionJob } from '@/lib/distribution/distributionQueue';
import { processDistributionJobs } from '@/lib/distribution/distributionWorker';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { campaignId, assetId, platform, scheduledTime, metadata, executeNow, caption, mediaUrls } = await req.json().catch(() => ({}));

        if (!campaignId || !assetId || !platform) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const job = await enqueueDistributionJob({
            campaignId,
            assetId,
            platform,
            scheduledTime: scheduledTime || new Date().toISOString(),
            metadata: metadata || {},
            caption: caption || undefined,
            mediaUrls: mediaUrls || undefined
        });

        // ONLY trigger processing if explicitly requested (Approve & Post)
        if (executeNow) {
            processDistributionJobs().catch(err => console.error('Background processing error:', err));
        }

        return NextResponse.json({ success: true, job });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
