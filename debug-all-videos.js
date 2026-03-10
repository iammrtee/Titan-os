require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(URL, KEY);

async function searchAllVideos() {
    console.log("--- SEARCHING ALL VIDEO ASSETS ---");
    const { data, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .eq('asset_type', 'video');

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    console.log(`Found ${data.length} video assets globaly.`);
    data.forEach(a => {
        console.log(`[${a.created_at}] Campaign: ${a.campaign_id} | URL: ${a.asset_url}`);
    });
    console.log('--- END ---');
}

searchAllVideos();
