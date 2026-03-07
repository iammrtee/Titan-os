import { PlatformAdapter, DistributionResult } from './index';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

function isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase().split('?')[0];
    return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export class TikTokPlatformAdapter implements PlatformAdapter {
    private accessToken: string | undefined;
    private openId: string | undefined;

    constructor(accessToken?: string, openId?: string) {
        this.accessToken = accessToken || process.env.TIKTOK_ACCESS_TOKEN;
        this.openId = openId || process.env.TIKTOK_OPEN_ID;
    }

    async postAsset(assetUrl: string, content: string, metadata?: any): Promise<DistributionResult> {
        const token = metadata?.accessToken || this.accessToken;
        const openId = metadata?.openId || metadata?.platform_user_id || this.openId;

        if (!token || !openId) {
            return {
                success: false,
                error: 'TikTok configuration missing (Access Token or Open ID — please reconnect your TikTok account)'
            };
        }

        try {
            const isVideo = isVideoUrl(assetUrl);

            if (!isVideo) {
                // TikTok Content Posting API v2 supports images (Photo Slideshow)
                const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify({
                        post_info: {
                            title: content.substring(0, 150),
                            privacy_level: 'SELF_ONLY', // safe default; user can change
                            disable_duet: false,
                            disable_comment: false,
                            disable_stitch: false,
                        },
                        source_info: {
                            source: 'PULL_FROM_URL',
                            photo_cover_index: 0,
                            photo_images: [assetUrl],
                        },
                        post_mode: 'DIRECT_POST',
                        media_type: 'PHOTO',
                    })
                });

                const data = await res.json();
                if (!res.ok || data.error?.code !== 'ok') {
                    throw new Error(`TikTok Photo Post Error: ${JSON.stringify(data)}`);
                }

                return {
                    success: true,
                    platformJobId: data.data?.publish_id
                };
            }

            // ── VIDEO UPLOAD (Pull from URL) ──
            // Step 1: Initialize upload
            const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    post_info: {
                        title: content.substring(0, 150),
                        privacy_level: 'SELF_ONLY',
                        disable_duet: false,
                        disable_comment: false,
                        disable_stitch: false,
                        video_cover_timestamp_ms: 1000,
                    },
                    source_info: {
                        source: 'PULL_FROM_URL',
                        video_url: assetUrl,
                    },
                })
            });

            const initData = await initRes.json();
            if (!initRes.ok || initData.error?.code !== 'ok') {
                throw new Error(`TikTok Video Init Error: ${JSON.stringify(initData)}`);
            }

            const publishId = initData.data?.publish_id;

            // Step 2: Poll status until finished (up to ~2 minutes)
            let attempts = 0;
            while (attempts < 24) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify({ publish_id: publishId })
                });
                const statusData = await statusRes.json();
                const status = statusData.data?.status;

                console.log(`[TikTokAdapter] publish_id=${publishId} status=${status} attempt=${attempts + 1}`);

                if (status === 'PUBLISH_COMPLETE') {
                    return { success: true, platformJobId: publishId };
                }
                if (status === 'FAILED') {
                    throw new Error(`TikTok video publish failed: ${JSON.stringify(statusData)}`);
                }
                attempts++;
            }

            // Timed out — treat as a soft failure so it can be retried
            throw new Error(`TikTok publish timed out after polling. publish_id=${publishId}`);

        } catch (err: any) {
            console.error('[TikTokAdapter] Error:', err.message);
            return {
                success: false,
                error: err.message
            };
        }
    }
}
