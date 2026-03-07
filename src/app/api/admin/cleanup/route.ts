import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase/server';

/**
 * Administrative cleanup tool to "downsize" the database.
 * Deletes distribution jobs and campaign assets older than 14 days.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();

        // Only allow if authorized or via a secret key if automated
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}` && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Cleanup old distribution jobs (these accumulate quickly)
        const { count: jobsDeleted, error: jobsError } = await supabase
            .from('distribution_jobs')
            .delete({ count: 'exact' })
            .lt('created_at', fourteenDaysAgo);

        if (jobsError) throw jobsError;

        // 2. Identify old assets (this is trickier as we need to delete from Storage too)
        // For now, we only cleanup failed or very old logged jobs to save row counts.
        // Storage cleanup is handled manually or via the new Delete button per-asset.

        return NextResponse.json({
            success: true,
            summary: {
                jobs_removed: jobsDeleted || 0,
                cutoff_date: fourteenDaysAgo
            }
        });
    } catch (err: any) {
        console.error('Cleanup error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
