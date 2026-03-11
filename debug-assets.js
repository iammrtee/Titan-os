require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Loading environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, KEY);

async function checkAssets() {
    console.log('--- Checking Supabase Assets ---');
    const { data: assets, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!assets || assets.length === 0) {
        console.log('No assets found.');
    } else {
        assets.forEach(a => {
            console.log(`[${a.created_at}] ID: ${a.id} | Type: ${a.asset_type} | URL: ${a.asset_url}`);
        });
    }
}

checkAssets();
