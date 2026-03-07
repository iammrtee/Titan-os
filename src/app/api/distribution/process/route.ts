import { NextRequest, NextResponse } from 'next/server';
import { processDistributionJobs } from '@/lib/distribution/distributionWorker';

export async function GET(req: NextRequest) {
    try {
        // In a real app, protect this with a secret key or internal network check
        const authHeader = req.headers.get('authorization');
        if (process.env.INTERNAL_SECRET && authHeader !== `Bearer ${process.env.INTERNAL_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await processDistributionJobs();
        return NextResponse.json({ success: true, processed_at: new Date().toISOString() });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
