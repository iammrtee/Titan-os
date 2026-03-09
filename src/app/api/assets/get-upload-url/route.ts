import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { fileName, fileType, campaignId } = body;

        let assetType = 'image';
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (fileType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
            assetType = 'video';
        }

        if (!fileName) {
            return NextResponse.json({ error: 'Missing fileName' }, { status: 400 });
        }
        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
        }

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
            // Optionally handle bucketError here if creation fails
        }

        const fileExt = fileName.split('.').pop() || 'jpg';
        const uniqueName = `${campaignId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `assets/${uniqueName}`;

        const contentType = fileType;

        const { data, error } = await admin.storage.from(BUCKET_NAME).createSignedUploadUrl(filePath);

        if (error) {
            console.error('Signed URL error:', error);
            return NextResponse.json({ error: `Failed to generate upload URL: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            signedUrl: data.signedUrl,
            filePath,
            token: data.token,
            contentType,
            assetType
        });
    } catch (err: any) {
        console.error('Error generating signed URL:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
