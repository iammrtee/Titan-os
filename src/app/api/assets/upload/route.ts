import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const campaignId = formData.get('campaignId') as string;

        let assetType = formData.get('assetType') as string || 'image';

        // Auto-detect video
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (file.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
            assetType = 'video';
        }

        if (!file || !campaignId) {
            return NextResponse.json({ error: 'Missing file or campaignId' }, { status: 400 });
        }

        // 1. Ensure the storage bucket exists (admin client bypasses RLS)
        const admin = createAdminClient();
        const BUCKET_NAME = 'titanleap-assets-v1';
        const { data: buckets } = await admin.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
        if (!bucketExists) {
            const { error: bucketError } = await admin.storage.createBucket(BUCKET_NAME, {
                public: true,
                allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
                fileSizeLimit: 104857600 // 100MB
            });
            if (bucketError) {
                console.error('Bucket creation error:', bucketError);
                return NextResponse.json({ error: `Storage setup failed: ${bucketError.message}` }, { status: 500 });
            }
        }

        // 2. Upload to Supabase Storage (use admin to avoid RLS on storage)
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${campaignId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `assets/${fileName}`;

        const storageOptions = {
            contentType: file.type,
            upsert: false
        };

        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await admin
            .storage
            .from(BUCKET_NAME)
            .upload(filePath, arrayBuffer, storageOptions);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = admin
            .storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        // 4. Create Asset Record (use user client so RLS applies correctly)
        const { data: asset, error: assetError } = await supabase
            .from('campaign_assets')
            .insert({
                campaign_id: campaignId,
                asset_type: assetType,
                asset_url: publicUrl,
                metadata: {
                    original_name: file.name,
                    size_bytes: file.size,
                    mime_type: file.type,
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
        console.error('Upload error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
