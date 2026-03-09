import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { filePath, campaignId, assetType, metadata } = body;

        if (!filePath) {
            return NextResponse.json({ error: 'Missing filePath' }, { status: 400 });
        }
        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
        }

        const admin = createAdminClient();

        // Get Public URL
        const BUCKET_NAME = 'titanleap-assets-v1';
        const { data: { publicUrl } } = admin
            .storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        // Create Asset Record (use user client so RLS applies correctly)
        const { data: asset, error: assetError } = await supabase
            .from('campaign_assets')
            .insert({
                campaign_id: campaignId,
                asset_type: assetType,
                asset_url: publicUrl,
                metadata: {
                    ...metadata,
                    manual_upload: true
                }
            })
            .select()
            .single();

        if (assetError) {
            console.error('Asset record error:', assetError);
            return NextResponse.json({ error: `Database error: ${assetError.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, asset });
    } catch (err: any) {
        console.error('Database record error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
