require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, KEY);

async function checkAllAssets() {
    console.log('--- ALL ASSETS CHECK ---');
    const { data, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    console.log('Recent Asset Summary:');
    data.forEach(a => {
        const metadata = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
        const name = metadata?.original_name || 'unknown';
        console.log(`[${a.created_at}] TYPE: ${a.asset_type} | NAME: ${name} | URL: ${a.asset_url}`);
    });
}

checkAllAssets();
