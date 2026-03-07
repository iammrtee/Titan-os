import { PlatformAdapter, DistributionResult } from './index';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

function isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase().split('?')[0];
    return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export class FacebookPlatformAdapter implements PlatformAdapter {
    private accessToken: string | undefined;
    private pageId: string | undefined;

    constructor(accessToken?: string, pageId?: string) {
        this.accessToken = accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        this.pageId = pageId || process.env.FACEBOOK_PAGE_ID;
    }

    async postAsset(assetUrl: string, content: string, metadata?: any): Promise<DistributionResult> {
        const token = metadata?.accessToken || this.accessToken;
        const pageId = metadata?.pageId || metadata?.primary_page_id || metadata?.platform_user_id || this.pageId;

        if (!token || !pageId) {
            return {
                success: false,
                error: 'Facebook configuration missing (Token or Page ID — please reconnect your Facebook account)'
            };
        }

        try {
            const isVideo = isVideoUrl(assetUrl);

            let res: Response;

            if (isVideo) {
                // Post video to Page feed via /videos endpoint
                res = await fetch(`https://graph.facebook.com/v22.0/${pageId}/videos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file_url: assetUrl,
                        description: content,
                        access_token: token
                    })
                });
            } else {
                // Post photo to Page feed
                res = await fetch(`https://graph.facebook.com/v22.0/${pageId}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: assetUrl,
                        message: content,
                        access_token: token
                    })
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(`Facebook API Error: ${JSON.stringify(data)}`);

            return {
                success: true,
                platformJobId: data.id || data.post_id
            };

        } catch (err: any) {
            console.error('[FacebookAdapter] Error:', err.message);
            return {
                success: false,
                error: err.message
            };
        }
    }
}
