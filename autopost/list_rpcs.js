const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listRpcs() {
    console.log("🔍 Checking RPCs...");
    // We can't query information_schema easily, but we can try to guess or use a system table if we have permissions
    const { data, error } = await supabase.from('pg_proc').select('proname').limit(10);

    if (error) {
        console.log("⚠️ pg_proc query restricted. Trying to find any available RPC...");
        // Usually, companies use a naming convention like 'get_...' or 'sync_...'
        const rpcs = ['exec_sql', 'query', 'run_sql', 'get_social_tokens'];
        for (const rpc of rpcs) {
            const { error: rpcError } = await supabase.rpc(rpc, { sql: 'SELECT 1;' });
            if (!rpcError || !rpcError.message.includes('not find the function')) {
                console.log(`✅ Potential RPC found: ${rpc}`);
            }
        }
    } else {
        console.log("Found functions:", data.map(f => f.proname).join(', '));
    }
}

listRpcs();
