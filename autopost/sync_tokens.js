const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncTokens() {
    console.log("🔄 Syncing Social Tokens from Supabase...");

    // Use .from() - I'll try it one more time with exact name
    const { data: accounts, error } = await supabase
        .from('social_accounts')
        .select('*');

    if (error) {
        console.error("❌ Error fetching tokens:", error.message);
        return;
    }

    if (!accounts || accounts.length === 0) {
        console.log("ℹ️ No social accounts found in database.");
        return;
    }

    const tokenMap = {};
    accounts.forEach(acc => {
        tokenMap[acc.platform] = {
            accessToken: acc.access_token,
            refreshToken: acc.refresh_token,
            expiresAt: acc.token_expires_at,
            metadata: acc.metadata,
            platformUserId: acc.platform_user_id
        };
        console.log(`✅ Synced ${acc.platform} (${acc.username || acc.display_name || 'unknown'})`);
    });

    const outputPath = path.join(__dirname, 'auth', 'tokens.json');
    fs.writeFileSync(outputPath, JSON.stringify(tokenMap, null, 2));
    console.log(`🚀 Saved ${accounts.length} tokens to ${outputPath}`);
}

syncTokens();
