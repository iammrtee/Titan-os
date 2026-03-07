const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTokens() {
    console.log("🔍 Checking Social Accounts in DB...");
    const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, username, access_token, refresh_token, metadata');

    if (error) {
        console.error("❌ Error fetching accounts:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("ℹ️ No social accounts found in database.");
        return;
    }

    data.forEach(acc => {
        console.log(`📌 Platform: ${acc.platform} | User: ${acc.username}`);
        console.log(`   Token Length: ${acc.access_token?.length || 0}`);
        console.log(`   Metadata:`, JSON.stringify(acc.metadata));
    });
}

checkTokens();
