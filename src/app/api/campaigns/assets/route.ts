import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { campaignId, assetType, assetUrl, metadata } = await req.json();

        if (!campaignId || !assetUrl) {
            return NextResponse.json({ error: 'campaignId and assetUrl are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('campaign_assets')
            .insert({
                campaign_id: campaignId,
                asset_type: assetType || 'flyer',
                asset_url: assetUrl,
                metadata: metadata || {}
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, asset: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
