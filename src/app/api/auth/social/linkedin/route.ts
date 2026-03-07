import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;

    if (!clientId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns?error=missing_config&platform=linkedin`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback`;
    const scope = 'w_member_social r_liteprofile w_organization_social'; // Standard permissions

    // Using a simple state for now, in production use a signed JWT or random string in session
    const state = 'linkedin';

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(authUrl);
}
