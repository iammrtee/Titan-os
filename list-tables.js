require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, KEY);

async function listTables() {
    console.log('--- LISTING TABLES ---');
    const { data, error } = await supabase.rpc('get_tables'); // If a custom RPC exists
    if (error) {
        // Fallback: try to query schemas
        const { data: data2, error: error2 } = await supabase
            .from('pg_catalog.pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');

        if (error2) {
            console.log('Could not list tables via pg_tables. Trying common names...');
            const tables = ['campaign_assets', 'content_assets', 'campaigns', 'projects', 'distribution_jobs'];
            for (const t of tables) {
                const { count, error: err3 } = await supabase.from(t).select('*', { count: 'exact', head: true });
                console.log(`Table: ${t} | Count: ${err3 ? 'ERROR (' + err3.message + ')' : count}`);
            }
        } else {
            data2.forEach(t => console.log('Table found:', t.tablename));
        }
    } else {
        console.log('Tables:', data);
    }
}

listTables();
