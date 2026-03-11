require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(URL, KEY);
const campaignId = "bef0957a-cbe8-4e0b-8b41-7d2093deb717";

async function checkCampaignAssets() {
    console.log(`--- CHECKING ASSETS FOR CAMPAIGN: ${campaignId} ---`);
    const { data, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .eq('campaign_id', campaignId);

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    console.log(`Found ${data.length} assets.`);
    data.forEach(a => {
        console.log(`ID: ${a.id} | Type: ${a.asset_type} | URL: ${a.asset_url}`);
    });
    console.log('--- END ---');
}

checkCampaignAssets();
