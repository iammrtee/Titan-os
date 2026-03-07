import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { processDistributionJobs } from '@/lib/distribution/distributionWorker';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { campaignId } = await req.json().catch(() => ({}));

        // Trigger the worker. The worker currently picks up 10 jobs at a time.
        // We trigger it to run immediately.
        await processDistributionJobs();

        // If there were many jobs, we might want to trigger it a few times or increase batch size, 
        // but for now, 1 pulse is a good start.

        return NextResponse.json({ success: true, message: 'Distribution worker triggered' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
