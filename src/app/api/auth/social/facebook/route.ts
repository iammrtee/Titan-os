import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const appId = process.env.FACEBOOK_APP_ID;

    if (!appId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns?error=missing_config&platform=facebook`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`;
    const scope = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts';

    const state = 'facebook';

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(authUrl);
}
