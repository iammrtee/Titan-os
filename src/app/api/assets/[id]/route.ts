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

        // 2. Extract storage path and bucket from URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const bucketMatch = asset.asset_url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);

        if (bucketMatch) {
            const bucketName = bucketMatch[1];
            const storagePath = bucketMatch[2];

            console.log(`Deleting from bucket ${bucketName}: ${storagePath}`);

            // Delete from Supabase Storage
            const { error: storageError } = await supabase
                .storage
                .from(bucketName)
                .remove([storagePath]);

            if (storageError) {
                console.error('Storage deletion error:', storageError);
            }
        } else {
            // Fallback for older formats or direct paths
            const urlParts = asset.asset_url.split('/campaign-assets/');
            if (urlParts.length > 1) {
                const storagePath = urlParts[1];
                await supabase.storage.from('campaign-assets').remove([storagePath]);
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
