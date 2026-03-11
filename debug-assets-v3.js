require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(URL, KEY);

async function checkAssets() {
    console.log('--- DB CHECK START ---');
    try {
        const { data: assets, error } = await supabase
            .from('campaign_assets')
            .select('id, asset_type, asset_url, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.log('DB_ERROR:', error.message);
        } else {
            console.log('FOUND_COUNT:', assets.length);
            assets.forEach(a => {
                console.log(`ASSET: [${a.asset_type}] ${a.asset_url}`);
            });
        }
    } catch (e) {
        console.log('CATCH_ERROR:', e.message);
    }
    console.log('--- DB CHECK END ---');
    process.exit(0);
}

setTimeout(() => {
    console.log('TIMEOUT_REACHED');
    process.exit(1);
}, 10000);

checkAssets();
