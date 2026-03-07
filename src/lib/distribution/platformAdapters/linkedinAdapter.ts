import { PlatformAdapter, DistributionResult } from './index';

export class LinkedInPlatformAdapter implements PlatformAdapter {
    private accessToken: string | undefined;
    private personId: string | undefined;

    constructor(accessToken?: string, orgId?: string) {
        this.accessToken = accessToken || process.env.LINKEDIN_ACCESS_TOKEN;
        // Fallback or override logic
    }

    async postAsset(assetUrl: string, content: string, metadata?: any): Promise<DistributionResult> {
        const token = metadata?.accessToken || this.accessToken;
        const orgId = metadata?.orgId || metadata?.primary_org_id || process.env.LINKEDIN_ORG_ID;
        const personId = metadata?.platform_user_id;

        if (!token) {
            return {
                success: false,
                error: 'LinkedIn configuration missing (no access token — please reconnect your LinkedIn account)'
            };
        }

        // Use org if available, else post as the connected person
        const ownerUrn = orgId
            ? `urn:li:organization:${orgId}`
            : personId
                ? (personId.startsWith('urn:') ? personId : `urn:li:person:${personId}`)
                : null;

        if (!ownerUrn) {
            return {
                success: false,
                error: 'LinkedIn configuration missing (Token or Org ID)'
            };
        }

        try {
            // 1. Register Image Upload
            const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify({
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                        owner: ownerUrn,
                        serviceRelationships: [{
                            relationshipType: 'OWNER',
                            identifier: 'urn:li:userGeneratedContent'
                        }]
                    }
                })
            });

            const registerData = await registerRes.json();
            if (!registerRes.ok) throw new Error(`LinkedIn Register Error: ${JSON.stringify(registerData)}`);

            const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
            const assetUrn = registerData.value.asset;

            // 2. Upload Image Binary
            const imageRes = await fetch(assetUrl);
            const imageBlob = await imageRes.blob();

            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: imageBlob
            });

            if (!uploadRes.ok) throw new Error('LinkedIn Image Upload Failed');

            // 3. Create the Post
            const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify({
                    author: ownerUrn,
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: { text: content },
                            shareMediaCategory: 'IMAGE',
                            media: [{
                                status: 'READY',
                                description: { text: 'Campaign Asset' },
                                media: assetUrn,
                                title: { text: 'Titan OS Content' }
                            }]
                        }
                    },
                    visibility: {
                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                    }
                })
            });

            const postData = await postRes.json();
            if (!postRes.ok) throw new Error(`LinkedIn Post Error: ${JSON.stringify(postData)}`);

            return {
                success: true,
                platformJobId: postData.id
            };

        } catch (err: any) {
            console.error('[LinkedInAdapter] Error:', err.message);
            return {
                success: false,
                error: err.message
            };
        }
    }
}
