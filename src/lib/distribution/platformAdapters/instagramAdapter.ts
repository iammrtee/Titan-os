import { PlatformAdapter, DistributionResult } from './index';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

function isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase().split('?')[0]; // strip query params
    return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export class InstagramPlatformAdapter implements PlatformAdapter {
    private accessToken: string | undefined;
    private businessId: string | undefined;

    constructor(accessToken?: string, businessId?: string) {
        this.accessToken = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
        this.businessId = businessId || process.env.INSTAGRAM_BUSINESS_ID;
    }

    async postAsset(assetUrl: string, content: string, metadata?: any): Promise<DistributionResult> {
        const token = metadata?.accessToken || this.accessToken;
        const businessId = metadata?.businessId || metadata?.platform_user_id || this.businessId;

        if (!token || !businessId) {
            return {
                success: false,
                error: 'Instagram configuration missing (Token or Business ID — please reconnect your Instagram account)'
            };
        }

        try {
            const isVideo = isVideoUrl(assetUrl);

            // 1. Create Media Container
            const containerBody: Record<string, any> = {
                caption: content,
                access_token: token,
            };

            if (isVideo) {
                // Instagram Reels via Graph API
                containerBody.media_type = 'REELS';
                containerBody.video_url = assetUrl;
                containerBody.share_to_feed = true;
            } else {
                containerBody.image_url = assetUrl;
            }

            const containerRes = await fetch(`https://graph.facebook.com/v22.0/${businessId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(containerBody)
            });

            const containerData = await containerRes.json();
            if (!containerRes.ok) throw new Error(`Instagram Container Error: ${JSON.stringify(containerData)}`);

            const creationId = containerData.id;

            // 2. Poll for status (videos take longer to process)
            if (isVideo) {
                let attempts = 0;
                while (attempts < 15) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    const statusRes = await fetch(
                        `https://graph.facebook.com/v22.0/${creationId}?fields=status_code&access_token=${token}`
                    );
                    const statusData = await statusRes.json();
                    if (statusData.status_code === 'FINISHED') break;
                    if (statusData.status_code === 'ERROR') {
                        throw new Error(`Instagram video processing failed: ${JSON.stringify(statusData)}`);
                    }
                    attempts++;
                }
            } else {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // 3. Publish Media
            const publishRes = await fetch(`https://graph.facebook.com/v22.0/${businessId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: creationId,
                    access_token: token
                })
            });

            const publishData = await publishRes.json();
            if (!publishRes.ok) throw new Error(`Instagram Publish Error: ${JSON.stringify(publishData)}`);

            return {
                success: true,
                platformJobId: publishData.id
            };

        } catch (err: any) {
            console.error('[InstagramAdapter] Error:', err.message);
            return {
                success: false,
                error: err.message
            };
        }
    }
}
