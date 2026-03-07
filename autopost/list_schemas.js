const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listSchemas() {
    console.log("🔍 Checking Schemas...");
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'SELECT schema_name FROM information_schema.schemata;'
    });

    if (error) {
        // Fallback for limited permission users
        console.log("⚠️ Schema query restricted:", error.message);
    } else {
        console.log("Schemas:", data.map(s => s.schema_name).join(', '));
    }
}

listSchemas();
