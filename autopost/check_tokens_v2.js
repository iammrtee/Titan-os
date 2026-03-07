const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTokensRaw() {
    console.log("🔍 Checking Social Accounts via RPC/Raw...");
    // Since .from() might fail due to cache, let's try a different way if possible
    // or just try .from() again now that I know it exists
    const { data, error } = await supabase
        .from('social_accounts')
        .select('*');

    if (error) {
        console.error("❌ Error fetching accounts:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("ℹ️ No social accounts found in database.");
        return;
    }

    data.forEach(acc => {
        console.log(`📌 Platform: ${acc.platform} | User: ${acc.username || acc.display_name}`);
        console.log(`   Account ID: ${acc.id}`);
        console.log(`   Has Token: ${!!acc.access_token}`);
    });
}

checkTokensRaw();
