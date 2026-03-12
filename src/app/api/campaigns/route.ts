import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');

        // Simplify query: remove joins to maximize performance
        let query = supabase
            .from('campaigns')
            .select('id, status, flyer_image_url, created_at, project_id');

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data: campaigns, error } = await query.order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ campaigns: campaigns || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
    }
}
