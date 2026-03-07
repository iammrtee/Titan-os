const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
    console.log("📊 Listing Tables...");
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (error) {
        // Fallback for limited permission users
        console.log("⚠️ information_schema access restricted. Trying direct select...");
        const { error: directError } = await supabase.from('distribution_jobs').select('count', { count: 'exact', head: true });
        if (!directError) console.log("✅ distribution_jobs exists");

        const { error: socialError } = await supabase.from('social_accounts').select('count', { count: 'exact', head: true });
        if (!socialError) console.log("✅ social_accounts exists");
        else console.log("❌ social_accounts NOT FOUND:", socialError.message);
    } else {
        console.log("Tables:", data.map(t => t.table_name).join(', '));
    }
}

listTables();
