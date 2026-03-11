import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { campaignId } = await req.json();

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
        }

        // Delete all distribution jobs for this campaign that are 'pending' or 'failed'
        // We might want to keep 'success' jobs or 'processing' jobs for history/integrity
        const { error } = await supabase
            .from('distribution_jobs')
            .delete()
            .eq('campaign_id', campaignId)
            .in('status', ['pending', 'failed']);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Queue cleared' });
    } catch (err: any) {
        console.error('Error clearing queue:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
