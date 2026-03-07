import { PlatformAdapter, DistributionResult } from './index';

export class XPlatformAdapter implements PlatformAdapter {
    private accessToken: string | undefined;

    constructor(accessToken?: string) {
        this.accessToken = accessToken || process.env.X_ACCESS_TOKEN;
    }

    async postAsset(assetUrl: string, content: string, metadata?: any): Promise<DistributionResult> {
        const token = metadata?.accessToken || this.accessToken;

        if (!token) {
            return {
                success: false,
                error: 'X configuration missing (Access Token)'
            };
        }

        try {
            // 1. Upload Media part
            console.log('[XAdapter] Downloading asset for upload...');
            const imageRes = await fetch(assetUrl);
            const imageBuffer = await imageRes.arrayBuffer();

            // X Media Upload (v1.1 endpoint is still used for media)
            // Note: This is an simplified implementation for small files (<5MB)
            // For larger files, a chunked upload process is required.
            const formData = new FormData();
            formData.append('media', new Blob([imageBuffer]));

            console.log('[XAdapter] Uploading media to X...');
            const uploadRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(`X Media Upload Error: ${JSON.stringify(uploadData)}`);

            const mediaId = uploadData.media_id_string;
            console.log(`[XAdapter] Media uploaded successfully, ID: ${mediaId}`);

            // 2. Post Tweet with Media ID
            const res = await fetch('https://api.twitter.com/2/tweets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: content,
                    media: {
                        media_ids: [mediaId]
                    }
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(`X API Error: ${JSON.stringify(data)}`);

            return {
                success: true,
                platformJobId: data.data.id
            };

        } catch (err: any) {
            console.error('[XAdapter] Error:', err.message);
            return {
                success: false,
                error: err.message
            };
        }
    }
}
