import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // 'linkedin', 'instagram', etc.
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${error}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_code`);
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        if (state === 'linkedin') {
            const tokenRes = await fetch('https://api.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`,
                    client_id: process.env.LINKEDIN_CLIENT_ID!,
                    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
                }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));

            const profileRes = await fetch('https://api.linkedin.com/v2/me', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            const profileData = await profileRes.json();

            // Fetch managed organizations (Companies)
            const orgsRes = await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            const orgsData = await orgsRes.json();
            const firstOrgUrn = orgsData.elements?.[0]?.organizationalTarget;
            const orgId = firstOrgUrn ? firstOrgUrn.split(':').pop() : null;

            const { error: dbError } = await supabase
                .from('social_accounts')
                .upsert({
                    user_id: user.id,
                    platform: 'linkedin',
                    platform_user_id: profileData.id,
                    display_name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                    metadata: { ...profileData, managed_orgs: orgsData.elements, primary_org_id: orgId }
                }, { onConflict: 'user_id,platform,platform_user_id' });

            if (dbError) throw dbError;
        } else if (state === 'x') {
            const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`,
                    code_verifier: 'challenge',
                }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));

            const userRes = await fetch('https://api.twitter.com/2/users/me', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            const userData = await userRes.json();

            const { error: dbError } = await supabase
                .from('social_accounts')
                .upsert({
                    user_id: user.id,
                    platform: 'x',
                    platform_user_id: userData.data.id,
                    username: userData.data.username,
                    display_name: userData.data.name,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                    metadata: userData.data
                }, { onConflict: 'user_id,platform,platform_user_id' });

            if (dbError) throw dbError;
        } else if (state === 'tiktok') {
            const tokenRes = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_key: process.env.TIKTOK_CLIENT_KEY!,
                    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
                    code,
                    grant_type: 'authorization_code'
                }),
            });

            const tokenData = await tokenRes.json();
            if (tokenData.message !== 'success') throw new Error(JSON.stringify(tokenData));

            // Fetch profile for TikTok
            const profileRes = await fetch('https://open-api.tiktok.com/user/info/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    open_id: tokenData.data.open_id,
                    access_token: tokenData.data.access_token,
                    fields: ['display_name', 'avatar_url']
                })
            });
            const profileData = await profileRes.json();

            const { error: dbError } = await supabase
                .from('social_accounts')
                .upsert({
                    user_id: user.id,
                    platform: 'tiktok',
                    platform_user_id: tokenData.data.open_id,
                    display_name: profileData.data?.user?.display_name,
                    avatar_url: profileData.data?.user?.avatar_url,
                    access_token: tokenData.data.access_token,
                    refresh_token: tokenData.data.refresh_token,
                    token_expires_at: new Date(Date.now() + tokenData.data.expires_in * 1000).toISOString(),
                    metadata: profileData.data?.user
                }, { onConflict: 'user_id,platform,platform_user_id' });

            if (dbError) throw dbError;
        } else if (state === 'facebook') {
            const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`);
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));

            const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
            const profileData = await profileRes.json();

            // Fetch managed Pages
            const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${tokenData.access_token}`);
            const pagesData = await pagesRes.json();
            const firstPage = pagesData.data?.[0];

            const { error: dbError } = await supabase
                .from('social_accounts')
                .upsert({
                    user_id: user.id,
                    platform: 'facebook',
                    platform_user_id: profileData.id,
                    display_name: profileData.name,
                    avatar_url: profileData.picture?.data?.url,
                    access_token: tokenData.access_token,
                    token_expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
                    metadata: { ...profileData, managed_pages: pagesData.data, primary_page_id: firstPage?.id }
                }, { onConflict: 'user_id,platform,platform_user_id' });

            if (dbError) throw dbError;
        } else if (state === 'instagram') {
            const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.INSTAGRAM_APP_ID!,
                    client_secret: process.env.INSTAGRAM_APP_SECRET!,
                    grant_type: 'authorization_code',
                    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`,
                    code
                }),
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));

            const profileRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`);
            const profileData = await profileRes.json();

            // For Instagram Business, we often need to go through Facebook's /me/accounts 
            // but if using the new Instagram Business Login, we might get the ID here.
            // For now, attempt to find a linked Business Account if the token is valid for Graph API.
            let businessId = null;
            try {
                const igPagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${tokenData.access_token}`);
                const igPagesData = await igPagesRes.json();
                businessId = igPagesData.data?.find((p: any) => p.instagram_business_account)?.instagram_business_account?.id;
            } catch (err) {
                console.warn('Could not fetch IG Business ID from FB graph:', err);
            }

            const { error: dbError } = await supabase
                .from('social_accounts')
                .upsert({
                    user_id: user.id,
                    platform: 'instagram',
                    platform_user_id: tokenData.user_id || profileData.id,
                    username: profileData.username,
                    access_token: tokenData.access_token,
                    metadata: { ...profileData, primary_business_id: businessId || tokenData.user_id || profileData.id }
                }, { onConflict: 'user_id,platform,platform_user_id' });

            if (dbError) throw dbError;
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=social_connected`);
    } catch (err: any) {
        console.error('[SocialCallback] Error:', err.message);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`);
    }
}
