const { createClient } = require('@supabase/supabase-js');

const URL = "https://lvplnbjkflpbzceznxaf.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cGxuYmprZmxwYnpjZXpueGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODc1NywiZXhwIjoyMDg3NDQ0NzU3fQ.0Ic4MG0TKkKkB-jqIqUjhd0ze7Tsyi8XT9Bkmnmsk2Y";

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
