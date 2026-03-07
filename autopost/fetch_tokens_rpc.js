const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchTokensRpc() {
    console.log("🔍 Fetching Tokens via exec_sql RPC...");
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'SELECT platform, username, display_name, access_token, metadata FROM public.social_accounts;'
    });

    if (error) {
        console.error("❌ RPC Error:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("ℹ️ No social accounts found in database.");
        return;
    }

    data.forEach(acc => {
        console.log(`📌 Platform: ${acc.platform} | User: ${acc.username || acc.display_name}`);
        console.log(`   Token Length: ${acc.access_token?.length || 0}`);
        console.log(`   Metadata:`, JSON.stringify(acc.metadata));
    });
}

fetchTokensRpc();
