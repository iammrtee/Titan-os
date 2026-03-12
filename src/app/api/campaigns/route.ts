import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const projectIdRaw = searchParams.get('projectId');
        
        if (!projectIdRaw) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }
        
        const projectId = projectIdRaw.trim();

        // Security Check: Verify user owns the project before using admin client
        const { data: projectOwnership, error: ownershipError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (ownershipError || !projectOwnership) {
            console.error('Ownership check failed:', ownershipError);
            return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        // Use Admin client to bypass potential RLS issues with campaigns table
        const adminSupabase = createAdminClient();
        
        const { data: campaigns, error: fetchError } = await adminSupabase
            .from('campaigns')
            .select('id, status, flyer_image_url, created_at, project_id, flyer_content, flyer_style')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        return NextResponse.json({ campaigns: campaigns || [] });
    } catch (err: any) {
        console.error('Unexpected error in campaigns API:', err);
        return NextResponse.json({ error: err?.message }, { status: 500 });
    }
}
