import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectId, name } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        // Check if there are existing strategy/funnel outputs to link
        const { data: positioning } = await supabase
            .from('positioning_output')
            .select('id')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const { data: funnel } = await supabase
            .from('funnel_output')
            .select('id')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                project_id: projectId,
                status: 'complete', // Lightweight campaigns start as complete containers
                strategy_id: positioning?.id || null,
                funnel_id: funnel?.id || null
                // flyer_image_url is now null because we use campaign_assets
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, campaign: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
