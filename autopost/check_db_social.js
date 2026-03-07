const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDb() {
    console.log("💾 Checking social_accounts table via RPC...");
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT platform, user_id, organization_id, updated_at FROM social_accounts"
    });

    if (error) {
        console.error("❌ SQL Error:", error.message);
        return;
    }

    console.log("📊 Social Accounts in DB:");
    console.table(data);
}

checkDb();
