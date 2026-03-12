import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/supabase/server';

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

        // 1. Fetch asset using admin client to find its project and owner
        const adminSupabase = createAdminClient();
        const { data: asset, error: fetchError } = await adminSupabase
            .from('campaign_assets')
            .select('*, campaigns!inner(projects!inner(user_id))')
            .eq('id', id)
            .single();

        if (fetchError || !asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Manual Ownership Check
        if (asset.campaigns.projects.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Storage Cleanup (using Admin client)
        const bucketMatch = asset.asset_url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
        
        if (bucketMatch) {
            const bucketName = bucketMatch[1];
            const storagePath = bucketMatch[2];
            await adminSupabase.storage.from(bucketName).remove([storagePath]);
        } else {
            // Check for direct path format
            const BUCKET_NAME = 'titanleap-assets-v1';
            const urlParts = asset.asset_url.split(`/${BUCKET_NAME}/`);
            if (urlParts.length > 1) {
                await adminSupabase.storage.from(BUCKET_NAME).remove([urlParts[1]]);
            }
        }

        // 3. Database Deletion (using Admin client)
        const { error: dbError } = await adminSupabase
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
