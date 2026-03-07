import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientId = process.env.X_CLIENT_ID;

    if (!clientId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns?error=missing_config&platform=x`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`;
    const scope = 'tweet.read tweet.write users.read offline.access';

    // In production, store code_verifier and state in a secure cookie or session
    const state = 'x';
    const codeChallenge = 'challenge'; // Simplified for now, use real PKCE in production

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;

    return NextResponse.redirect(authUrl);
}
