import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch asset to get URL and verify ownership indirectly via campaign
        const { data: asset, error: fetchError } = await supabase
            .from('campaign_assets')
            .select('*, campaigns!inner(projects!inner(user_id))')
            .eq('id', id)
            .single();

        if (fetchError || !asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Check if user owns the project this asset belongs to
        if (asset.campaigns.projects.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Extract storage path from URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/campaign-assets/[path]
        const urlParts = asset.asset_url.split('/campaign-assets/');
        if (urlParts.length > 1) {
            const storagePath = urlParts[1];

            // Delete from Supabase Storage
            const { error: storageError } = await supabase
                .storage
                .from('campaign-assets')
                .remove([storagePath]);

            if (storageError) {
                console.error('Storage deletion error:', storageError);
                // We proceed to delete from DB even if cloud storage fails, 
                // but ideally we'd log this for manual cleanup.
            }
        }

        // 3. Delete from Database
        const { error: dbError } = await supabase
            .from('campaign_assets')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Delete asset error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
