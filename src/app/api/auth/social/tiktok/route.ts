import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;

    if (!clientKey) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns?error=missing_config&platform=tiktok`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`;
    const scope = 'user.info.basic,video.upload,video.publish';

    const state = 'tiktok';

    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return NextResponse.redirect(authUrl);
}
