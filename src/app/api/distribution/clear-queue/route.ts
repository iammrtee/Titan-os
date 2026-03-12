import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { campaignId } = await req.json();

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
        }

        const campaignIdTrimmed = campaignId.trim();

        // 1. Verify project ownership before deleting queue
        const { data: campaignOwnership, error: ownershipError } = await supabase
            .from('campaigns')
            .select('id, projects!inner(user_id)')
            .eq('id', campaignIdTrimmed)
            .single();

        if (ownershipError || !campaignOwnership || (campaignOwnership.projects as any).user_id !== user.id) {
            console.error('Clear queue ownership check failed:', ownershipError);
            return NextResponse.json({ error: 'Campaign not found or unauthorized' }, { status: 404 });
        }

        const adminSupabase = createAdminClient();

        // 2. Delete all distribution jobs for this campaign that are 'pending' or 'failed' using Admin client
        const { error } = await adminSupabase
            .from('distribution_jobs')
            .delete()
            .eq('campaign_id', campaignIdTrimmed)
            .in('status', ['pending', 'failed']);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Queue cleared successfully' });
    } catch (err: any) {
        console.error('Error clearing queue:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
