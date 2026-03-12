import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');

        // Optimize query: select only what's needed and use a single join
        let query = supabase
            .from('campaigns')
            .select('id, status, flyer_image_url, created_at, project_id, campaign_assets(asset_url)');

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data: campaigns, error } = await query.order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Transform to include a cover image if flyer_image_url is missing
        const transformedCampaigns = (campaigns || []).map((c: any) => {
            const assetUrl = Array.isArray(c.campaign_assets) && c.campaign_assets[0]?.asset_url;
            return {
                ...c,
                flyer_image_url: c.flyer_image_url || assetUrl || null,
                campaign_assets: undefined // Hide the raw array from response
            };
        });

        return NextResponse.json({ campaigns: transformedCampaigns });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
    }
}
