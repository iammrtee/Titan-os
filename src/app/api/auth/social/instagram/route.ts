import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const appId = process.env.INSTAGRAM_APP_ID;

    if (!appId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns?error=missing_config&platform=instagram`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`;
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';

    const state = 'instagram';

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;

    return NextResponse.redirect(authUrl);
}
